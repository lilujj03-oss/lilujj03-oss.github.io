from __future__ import annotations

import os
import sqlite3
import sys
import threading
import time
from datetime import datetime, timedelta, timezone
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.common import (
    FORECAST_DB_PATH,
    FRONTEND_DIR,
    RAW_OBSERVATION_PATH,
    WEATHER_DB_PATH,
    get_api_key,
    redact_sensitive_text,
)
from backend.download_weather import download_observation
from backend.parser import ensure_schema, parse_file
from backend.rainfall import ensure_rainfall_schema, run_rainfall_update
from crawler import run_forecast_update


TAIPEI_TZ = timezone(timedelta(hours=8))


def _auto_update_minutes() -> int:
    try:
        return max(0, int(os.getenv("AUTO_UPDATE_MINUTES", "60")))
    except ValueError:
        return 60


AUTO_UPDATE_MINUTES = _auto_update_minutes()

app = FastAPI(
    title="七逃行｜台灣即時氣象資料系統",
    description="O-A0001-001 即時觀測與 F-D0047-091 一週預報 REST API",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

ensure_schema()
ensure_rainfall_schema()

_update_lock = threading.Lock()
_update_state: dict[str, Any] = {
    "running": False,
    "started_at": None,
    "finished_at": None,
    "message": "尚未執行更新",
    "error": None,
    "observation_count": 0,
    "rainfall_count": 0,
    "forecast_count": 0,
    "trigger": None,
    "next_auto_update": None,
}
_auto_update_stop = threading.Event()
_auto_update_thread: threading.Thread | None = None


def _now_iso() -> str:
    return datetime.now(TAIPEI_TZ).isoformat(timespec="seconds")


def _sqlite_utc_to_taipei(value: str | None) -> str | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return value
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(TAIPEI_TZ).isoformat(timespec="seconds")


def _latest_database_update(value: str | None) -> str | None:
    if RAW_OBSERVATION_PATH.exists():
        modified = datetime.fromtimestamp(RAW_OBSERVATION_PATH.stat().st_mtime, TAIPEI_TZ)
        return modified.isoformat(timespec="seconds")
    return _sqlite_utc_to_taipei(value)


def _connect_weather() -> sqlite3.Connection:
    connection = sqlite3.connect(WEATHER_DB_PATH, timeout=30)
    connection.row_factory = sqlite3.Row
    return connection


def _row_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    return dict(row) if row is not None else None


def _latest_station_sql(
    county: str | None = None,
    search: str | None = None,
) -> tuple[str, list[Any]]:
    where: list[str] = []
    params: list[Any] = []
    if county:
        where.append("o.county = ?")
        params.append(county)
    if search:
        where.append(
            "(o.station_name LIKE ? OR o.station_id LIKE ? OR "
            "o.county LIKE ? OR o.town LIKE ?)"
        )
        keyword = f"%{search}%"
        params.extend([keyword, keyword, keyword, keyword])
    clause = "WHERE " + " AND ".join(where) if where else ""
    sql = f"""
        SELECT o.*
        FROM observations AS o
        INNER JOIN (
            SELECT station_id, MAX(observed_at) AS latest_at
            FROM observations
            GROUP BY station_id
        ) AS latest
        ON latest.station_id = o.station_id
        AND latest.latest_at = o.observed_at
        {clause}
        ORDER BY o.county, o.station_name
    """
    return sql, params


@app.get("/api/health")
def health() -> dict[str, Any]:
    with _connect_weather() as connection:
        row = connection.execute(
            "SELECT COUNT(DISTINCT station_id) AS stations, "
            "COUNT(*) AS observations, "
            "COUNT(DISTINCT observed_at) AS observation_snapshots, "
            "MAX(observed_at) AS latest_at, MAX(created_at) AS database_updated_at "
            "FROM observations"
        ).fetchone()
        rainfall_row = connection.execute(
            "SELECT COUNT(DISTINCT station_id) AS stations, "
            "COUNT(*) AS observations, MAX(observed_at) AS latest_at "
            "FROM rainfall_observations"
        ).fetchone()
    forecast_count = 0
    if FORECAST_DB_PATH.exists():
        try:
            with sqlite3.connect(FORECAST_DB_PATH) as connection:
                forecast_count = int(
                    connection.execute("SELECT COUNT(*) FROM forecast").fetchone()[0]
                )
        except sqlite3.Error:
            forecast_count = 0
    with _update_lock:
        update = dict(_update_state)
    return {
        "status": "ok",
        "server_time": _now_iso(),
        "api_key_configured": bool(get_api_key(required=False)),
        "stations": int(row["stations"] or 0),
        "observations": int(row["observations"] or 0),
        "observation_snapshots": int(row["observation_snapshots"] or 0),
        "rainfall_stations": int(rainfall_row["stations"] or 0),
        "rainfall_observations": int(rainfall_row["observations"] or 0),
        "forecast_records": forecast_count,
        "latest_observation": row["latest_at"],
        "latest_rainfall": rainfall_row["latest_at"],
        "database_updated_at": _latest_database_update(row["database_updated_at"]),
        "auto_update_minutes": AUTO_UPDATE_MINUTES,
        "next_auto_update": update["next_auto_update"],
        "update": update,
    }


@app.get("/api/counties")
def counties() -> list[str]:
    with _connect_weather() as connection:
        rows = connection.execute(
            "SELECT DISTINCT county FROM observations "
            "WHERE county IS NOT NULL AND county <> '' ORDER BY county"
        ).fetchall()
    return [str(row[0]) for row in rows]


@app.get("/api/stations")
def stations(
    county: str | None = Query(default=None, max_length=20),
    search: str | None = Query(default=None, max_length=60),
) -> list[dict[str, Any]]:
    sql, params = _latest_station_sql(county=county, search=search)
    with _connect_weather() as connection:
        rows = connection.execute(sql, params).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/stations/{station_id}")
def station_detail(station_id: str) -> dict[str, Any]:
    with _connect_weather() as connection:
        row = connection.execute(
            "SELECT * FROM observations WHERE station_id = ? "
            "ORDER BY observed_at DESC LIMIT 1",
            (station_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="找不到指定測站")
    return dict(row)


@app.get("/api/stations/{station_id}/history")
def station_history(
    station_id: str,
    hours: int = Query(default=24, ge=1, le=720),
) -> list[dict[str, Any]]:
    cutoff = (datetime.now(TAIPEI_TZ) - timedelta(hours=hours)).isoformat(timespec="seconds")
    with _connect_weather() as connection:
        rows = connection.execute(
            "SELECT * FROM observations "
            "WHERE station_id = ? AND observed_at >= ? "
            "ORDER BY observed_at ASC",
            (station_id, cutoff),
        ).fetchall()
        if not rows:
            rows = connection.execute(
                "SELECT * FROM observations WHERE station_id = ? "
                "ORDER BY observed_at DESC LIMIT ?",
                (station_id, max(3, hours)),
            ).fetchall()[::-1]
    return [dict(row) for row in rows]


def _distance_km(
    latitude_a: float,
    longitude_a: float,
    latitude_b: float,
    longitude_b: float,
) -> float:
    """Return the great-circle distance between two WGS84 coordinates."""
    lat_a, lon_a, lat_b, lon_b = map(
        radians,
        (latitude_a, longitude_a, latitude_b, longitude_b),
    )
    delta_lat = lat_b - lat_a
    delta_lon = lon_b - lon_a
    value = sin(delta_lat / 2) ** 2 + cos(lat_a) * cos(lat_b) * sin(delta_lon / 2) ** 2
    return 6371.0088 * 2 * asin(min(1.0, sqrt(value)))


@app.get("/api/stations/{station_id}/rainfall")
def station_rainfall(
    station_id: str,
    hours: int = Query(default=8, ge=1, le=24),
) -> dict[str, Any]:
    with _connect_weather() as connection:
        selected = connection.execute(
            "SELECT station_id, station_name, latitude, longitude "
            "FROM observations WHERE station_id = ? "
            "ORDER BY observed_at DESC LIMIT 1",
            (station_id,),
        ).fetchone()
        if selected is None:
            raise HTTPException(status_code=404, detail="找不到指定測站")

        rainfall_station = connection.execute(
            "SELECT * FROM rainfall_observations WHERE station_id = ? "
            "ORDER BY observed_at DESC LIMIT 1",
            (station_id,),
        ).fetchone()
        distance = 0.0 if rainfall_station is not None else None

        if (
            rainfall_station is None
            and selected["latitude"] is not None
            and selected["longitude"] is not None
        ):
            candidates = connection.execute(
                "SELECT r.* FROM rainfall_observations AS r "
                "INNER JOIN ("
                "SELECT station_id, MAX(observed_at) AS latest_at "
                "FROM rainfall_observations GROUP BY station_id"
                ") AS latest ON latest.station_id = r.station_id "
                "AND latest.latest_at = r.observed_at "
                "WHERE r.latitude IS NOT NULL AND r.longitude IS NOT NULL"
            ).fetchall()
            nearest: tuple[float, sqlite3.Row] | None = None
            for candidate in candidates:
                candidate_distance = _distance_km(
                    float(selected["latitude"]),
                    float(selected["longitude"]),
                    float(candidate["latitude"]),
                    float(candidate["longitude"]),
                )
                if nearest is None or candidate_distance < nearest[0]:
                    nearest = (candidate_distance, candidate)
            if nearest is not None:
                distance, rainfall_station = nearest

        observations: list[dict[str, Any]] = []
        if rainfall_station is not None:
            observations = [
                dict(row)
                for row in connection.execute(
                    "SELECT observed_at, hourly_rainfall, daily_rainfall "
                    "FROM rainfall_observations WHERE station_id = ? "
                    "ORDER BY observed_at DESC LIMIT ?",
                    (rainfall_station["station_id"], hours),
                ).fetchall()[::-1]
            ]

    return {
        "requested_station_id": station_id,
        "station_id": rainfall_station["station_id"] if rainfall_station is not None else None,
        "station_name": rainfall_station["station_name"] if rainfall_station is not None else None,
        "county": rainfall_station["county"] if rainfall_station is not None else None,
        "town": rainfall_station["town"] if rainfall_station is not None else None,
        "latitude": rainfall_station["latitude"] if rainfall_station is not None else None,
        "longitude": rainfall_station["longitude"] if rainfall_station is not None else None,
        "is_nearest": bool(rainfall_station is not None and rainfall_station["station_id"] != station_id),
        "distance_km": round(distance, 2) if distance is not None else None,
        "hours": hours,
        "unit": "mm",
        "chart_range": [0, 50],
        "observations": observations,
    }


def _trend_prediction(rows: list[dict[str, Any]], field: str, minimum: float | None = None, maximum: float | None = None) -> float | None:
    values = [float(row[field]) for row in rows if row.get(field) is not None]
    if not values:
        return None
    recent = values[-3:]
    slope = (recent[-1] - recent[0]) / max(1, len(recent) - 1)
    prediction = recent[-1] + slope
    if minimum is not None:
        prediction = max(minimum, prediction)
    if maximum is not None:
        prediction = min(maximum, prediction)
    return round(prediction, 1)


@app.get("/api/stations/{station_id}/predict")
def station_prediction(station_id: str) -> dict[str, Any]:
    rows = station_history(station_id, hours=6)
    if not rows:
        raise HTTPException(status_code=404, detail="沒有足夠的測站歷史資料")
    latest_time = datetime.fromisoformat(rows[-1]["observed_at"])
    return {
        "station_id": station_id,
        "generated_at": _now_iso(),
        "forecast_time": (latest_time + timedelta(hours=1)).isoformat(timespec="seconds"),
        "sample_count": min(3, len(rows)),
        "algorithm": "Recent 3-hour linear trend",
        "notice": "此為短期趨勢外推，非中央氣象署官方預報。",
        "temperature": _trend_prediction(rows, "temperature"),
        "humidity": _trend_prediction(rows, "humidity", 0, 100),
        "precipitation": _trend_prediction(rows, "precipitation", 0),
        "wind_speed": _trend_prediction(rows, "wind_speed", 0),
    }


@app.get("/api/forecast")
def forecast(
    county: str = Query(..., min_length=2, max_length=20),
    limit: int = Query(default=14, ge=1, le=50),
) -> list[dict[str, Any]]:
    if not FORECAST_DB_PATH.exists():
        return []
    try:
        with sqlite3.connect(FORECAST_DB_PATH) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                "SELECT * FROM forecast "
                "WHERE REPLACE(location_name, '台', '臺') = REPLACE(?, '台', '臺') "
                "ORDER BY start_time LIMIT ?",
                (county, limit),
            ).fetchall()
    except sqlite3.Error as error:
        raise HTTPException(status_code=500, detail=f"預報資料庫讀取失敗：{error}") from error
    return [dict(row) for row in rows]


def _perform_update() -> None:
    global _update_state
    try:
        download_observation()
        observation_count = parse_file()
        rainfall_count = run_rainfall_update()
        forecast_count = run_forecast_update()
        with _update_lock:
            _update_state.update(
                {
                    "message": "觀測、每小時雨量與預報資料更新完成",
                    "error": None,
                    "observation_count": observation_count,
                    "rainfall_count": rainfall_count,
                    "forecast_count": forecast_count,
                }
            )
    except Exception as error:  # The status endpoint must preserve the crawler error for the UI.
        with _update_lock:
            _update_state.update(
                {
                    "message": "資料更新失敗",
                    "error": redact_sensitive_text(error),
                }
            )
    finally:
        with _update_lock:
            _update_state["running"] = False
            _update_state["finished_at"] = _now_iso()


def _auto_update_delay(interval_seconds: int, modified_at: float | None) -> float:
    """Return seconds until data becomes stale; overdue/missing data updates quickly."""
    if modified_at is None:
        return 3.0
    age = max(0.0, time.time() - modified_at)
    return max(3.0, interval_seconds - age)


def _automatic_update_loop() -> None:
    if AUTO_UPDATE_MINUTES <= 0:
        return
    interval_seconds = AUTO_UPDATE_MINUTES * 60
    modified_at = RAW_OBSERVATION_PATH.stat().st_mtime if RAW_OBSERVATION_PATH.exists() else None
    wait_seconds = _auto_update_delay(interval_seconds, modified_at)
    first_cycle = True
    startup_catchup = wait_seconds <= 3.5

    while not _auto_update_stop.is_set():
        next_update = datetime.now(TAIPEI_TZ) + timedelta(seconds=wait_seconds)
        with _update_lock:
            _update_state["next_auto_update"] = next_update.isoformat(timespec="seconds")
        if _auto_update_stop.wait(wait_seconds):
            break

        # A manual update may have refreshed the file while this thread was waiting.
        modified_at = RAW_OBSERVATION_PATH.stat().st_mtime if RAW_OBSERVATION_PATH.exists() else None
        if modified_at is not None:
            age = max(0.0, time.time() - modified_at)
            tolerance = min(5.0, interval_seconds / 10)
            if age < interval_seconds - tolerance:
                wait_seconds = _auto_update_delay(interval_seconds, modified_at)
                first_cycle = False
                continue

        should_update = False
        with _update_lock:
            if not _update_state["running"]:
                _update_state.update(
                    {
                        "running": True,
                        "started_at": _now_iso(),
                        "finished_at": None,
                        "message": "啟動後補抓過期資料" if first_cycle and startup_catchup else "每小時自動更新中央氣象署資料",
                        "error": None,
                        "trigger": "automatic_startup" if first_cycle and startup_catchup else "automatic",
                    }
                )
                should_update = True
        if should_update:
            _perform_update()
        wait_seconds = interval_seconds
        first_cycle = False


@app.on_event("startup")
def start_automatic_updates() -> None:
    global _auto_update_thread
    if AUTO_UPDATE_MINUTES <= 0 or (_auto_update_thread and _auto_update_thread.is_alive()):
        return
    _auto_update_stop.clear()
    _auto_update_thread = threading.Thread(
        target=_automatic_update_loop,
        name="cwa-automatic-update",
        daemon=True,
    )
    _auto_update_thread.start()


@app.on_event("shutdown")
def stop_automatic_updates() -> None:
    _auto_update_stop.set()


@app.post("/api/update", status_code=202)
def trigger_update(background_tasks: BackgroundTasks) -> dict[str, Any]:
    if not get_api_key(required=False):
        raise HTTPException(
            status_code=400,
            detail="尚未設定 CWA_API_KEY，請先編輯專案根目錄的 .env",
        )
    with _update_lock:
        if _update_state["running"]:
            return {"accepted": False, "message": "資料更新正在進行中"}
        _update_state.update(
            {
                "running": True,
                "started_at": _now_iso(),
                "finished_at": None,
                "message": "正在下載中央氣象署資料",
                "error": None,
                "trigger": "manual",
            }
        )
    background_tasks.add_task(_perform_update)
    return {"accepted": True, "message": "已開始更新觀測與預報資料"}


@app.get("/api/update/status")
def update_status() -> dict[str, Any]:
    return dict(_update_state)


app.mount("/assets", StaticFiles(directory=FRONTEND_DIR), name="assets")


@app.get("/", include_in_schema=False)
def frontend() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
    )
