from __future__ import annotations

import json
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.common import (
    RAW_RAINFALL_PATH,
    WEATHER_DB_PATH,
    as_list,
    atomic_write_json,
    fetch_cwa_dataset,
    safe_float,
)


def ensure_rainfall_schema(connection: sqlite3.Connection | None = None) -> None:
    owns_connection = connection is None
    if connection is None:
        connection = sqlite3.connect(WEATHER_DB_PATH, timeout=30)
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS rainfall_observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id TEXT NOT NULL,
            station_name TEXT NOT NULL,
            observed_at TEXT NOT NULL,
            county TEXT,
            town TEXT,
            latitude REAL,
            longitude REAL,
            hourly_rainfall REAL,
            daily_rainfall REAL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(station_id, observed_at)
        )
        """
    )
    connection.execute(
        "CREATE INDEX IF NOT EXISTS idx_rainfall_station_time "
        "ON rainfall_observations(station_id, observed_at DESC)"
    )
    connection.execute(
        "CREATE INDEX IF NOT EXISTS idx_rainfall_location "
        "ON rainfall_observations(latitude, longitude)"
    )
    connection.commit()
    if owns_connection:
        connection.close()


def _find_stations(node: Any) -> list[dict[str, Any]]:
    if isinstance(node, dict):
        for key in ("Station", "station"):
            if key in node:
                stations = [item for item in as_list(node[key]) if isinstance(item, dict)]
                if stations:
                    return stations
        for value in node.values():
            stations = _find_stations(value)
            if stations:
                return stations
    elif isinstance(node, list):
        for item in node:
            stations = _find_stations(item)
            if stations:
                return stations
    return []


def _coordinates(geo: dict[str, Any]) -> tuple[float | None, float | None]:
    coordinates = [item for item in as_list(geo.get("Coordinates")) if isinstance(item, dict)]
    selected = next(
        (item for item in coordinates if str(item.get("CoordinateName", "")).upper() == "WGS84"),
        coordinates[-1] if coordinates else {},
    )
    return safe_float(selected.get("StationLatitude")), safe_float(selected.get("StationLongitude"))


def _hour_bucket(value: str) -> str:
    """Keep one O-A0002 rainfall sample per station and clock hour."""
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return value
    return parsed.replace(minute=0, second=0, microsecond=0).isoformat(timespec="seconds")


def parse_rainfall_payload(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for station in _find_stations(payload.get("records", payload)):
        station_id = str(station.get("StationId") or station.get("StationID") or "").strip()
        station_name = str(station.get("StationName") or "").strip()
        observed_at = str((station.get("ObsTime") or {}).get("DateTime") or "").strip()
        if not station_id or not station_name or not observed_at:
            continue
        observed_at = _hour_bucket(observed_at)
        geo = station.get("GeoInfo") or {}
        rainfall = station.get("RainfallElement") or {}
        latitude, longitude = _coordinates(geo)
        rows.append(
            {
                "station_id": station_id,
                "station_name": station_name,
                "observed_at": observed_at,
                "county": str(geo.get("CountyName") or "").strip(),
                "town": str(geo.get("TownName") or "").strip(),
                "latitude": latitude,
                "longitude": longitude,
                "hourly_rainfall": safe_float(
                    (rainfall.get("Past1hr") or {}).get("Precipitation"),
                    precipitation=True,
                ),
                "daily_rainfall": safe_float(
                    (rainfall.get("Now") or {}).get("Precipitation"),
                    precipitation=True,
                ),
            }
        )
    return rows


def store_rainfall(rows: list[dict[str, Any]]) -> int:
    with sqlite3.connect(WEATHER_DB_PATH, timeout=30) as connection:
        ensure_rainfall_schema(connection)
        connection.executemany(
            """
            INSERT INTO rainfall_observations (
                station_id, station_name, observed_at, county, town,
                latitude, longitude, hourly_rainfall, daily_rainfall
            ) VALUES (
                :station_id, :station_name, :observed_at, :county, :town,
                :latitude, :longitude, :hourly_rainfall, :daily_rainfall
            )
            ON CONFLICT(station_id, observed_at) DO UPDATE SET
                station_name=excluded.station_name,
                county=excluded.county,
                town=excluded.town,
                latitude=excluded.latitude,
                longitude=excluded.longitude,
                hourly_rainfall=excluded.hourly_rainfall,
                daily_rainfall=excluded.daily_rainfall,
                created_at=CURRENT_TIMESTAMP
            """,
            rows,
        )
        connection.commit()
    return len(rows)


def parse_rainfall_file(path: Path = RAW_RAINFALL_PATH) -> int:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return store_rainfall(parse_rainfall_payload(payload))


def run_rainfall_update() -> int:
    payload = fetch_cwa_dataset("O-A0002-001")
    atomic_write_json(RAW_RAINFALL_PATH, payload)
    count = store_rainfall(parse_rainfall_payload(payload))
    print(f"已更新 O-A0002-001：{count} 個雨量站（過去 1 小時雨量）")
    return count


if __name__ == "__main__":
    run_rainfall_update()
