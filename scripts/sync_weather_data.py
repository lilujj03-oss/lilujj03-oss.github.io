from __future__ import annotations

import json
import os
import re
import sqlite3
import sys
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

TAIPEI_TZ = timezone(timedelta(hours=8))
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
SOURCE_DIR = REPO_ROOT / "qita-weather" / "source"
DATABASE_DIR = SOURCE_DIR / "database"
SNAPSHOT_PATH = REPO_ROOT / "qita-weather" / "assets" / "current-stations.json"

WEATHER_DB_PATH = DATABASE_DIR / "weather.db"
FORECAST_DB_PATH = SOURCE_DIR / "F-D0047-091_parsed.db"

BASE_URL = os.getenv("CWA_BASE_URL", "https://opendata.cwa.gov.tw/api/v1/rest/datastore").rstrip("/")


def get_api_key() -> str:
    key = os.getenv("CWA_API_KEY", "").strip()
    if not key:
        env_files = [SOURCE_DIR / ".env", REPO_ROOT / ".env"]
        for env_path in env_files:
            if env_path.exists():
                for line in env_path.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if line.startswith("CWA_API_KEY="):
                        key = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
            if key:
                break
    if not key and len(sys.argv) > 1:
        key = sys.argv[1].strip()
    if not key:
        raise RuntimeError("未設定 CWA_API_KEY。")
    return key


def fetch_cwa_dataset(dataset_id: str, api_key: str) -> dict[str, Any]:
    url = f"{BASE_URL}/{dataset_id}?Authorization={urllib.parse.quote(api_key)}&format=JSON"
    req = urllib.request.Request(url, headers={"User-Agent": "Qita-Weather-Sync/1.0"})
    with urllib.request.urlopen(req, timeout=45) as response:
        payload = json.loads(response.read().decode("utf-8"))
    if str(payload.get("success", "true")).lower() != "true":
        msg = payload.get("result", {}).get("message") or payload.get("message") or "API error"
        raise RuntimeError(f"CWA API 回傳錯誤：{msg}")
    return payload


def as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def safe_float(value: Any, *, precipitation: bool = False) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if precipitation and text.upper() in {"T", "-98"}:
        return 0.0
    if not text or text.upper() in {"X", "-99", "-999", "NULL", "NONE"}:
        return None
    try:
        num = float(text)
    except (TypeError, ValueError):
        return None
    if num <= -90:
        return 0.0 if precipitation and num == -98 else None
    return num


def clean_weather(value: Any) -> str | None:
    text = str(value or "").strip()
    return None if text.upper() in {"", "-99", "X"} else text


def find_stations(node: Any) -> list[dict[str, Any]]:
    if isinstance(node, dict):
        for key in ("Station", "station"):
            if key in node:
                values = [item for item in as_list(node[key]) if isinstance(item, dict)]
                if values:
                    return values
        for value in node.values():
            found = find_stations(value)
            if found:
                return found
    elif isinstance(node, list):
        for item in node:
            found = find_stations(item)
            if found:
                return found
    return []


def wgs84_coords(geo: dict[str, Any]) -> tuple[float | None, float | None]:
    coordinates = [item for item in as_list(geo.get("Coordinates")) if isinstance(item, dict)]
    selected = next(
        (item for item in coordinates if str(item.get("CoordinateName", "")).upper() == "WGS84"),
        coordinates[-1] if coordinates else {},
    )
    return safe_float(selected.get("StationLatitude")), safe_float(selected.get("StationLongitude"))


def parse_observation(station: dict[str, Any]) -> dict[str, Any] | None:
    station_id = str(station.get("StationId") or station.get("StationID") or "").strip()
    station_name = str(station.get("StationName") or "").strip()
    observed_at = str((station.get("ObsTime") or {}).get("DateTime") or "").strip()
    if not station_id or not station_name or not observed_at:
        return None

    geo = station.get("GeoInfo") or {}
    weather = station.get("WeatherElement") or {}
    latitude, longitude = wgs84_coords(geo)
    daily_extreme = weather.get("DailyExtreme") or {}
    daily_high = ((daily_extreme.get("DailyHigh") or {}).get("TemperatureInfo") or {}).get("AirTemperature")
    daily_low = ((daily_extreme.get("DailyLow") or {}).get("TemperatureInfo") or {}).get("AirTemperature")

    return {
        "station_id": station_id,
        "station_name": station_name,
        "observed_at": observed_at,
        "county": str(geo.get("CountyName") or "").strip(),
        "town": str(geo.get("TownName") or "").strip(),
        "latitude": latitude,
        "longitude": longitude,
        "altitude": safe_float(geo.get("StationAltitude")),
        "weather": clean_weather(weather.get("Weather")),
        "temperature": safe_float(weather.get("AirTemperature")),
        "humidity": safe_float(weather.get("RelativeHumidity")),
        "pressure": safe_float(weather.get("AirPressure")),
        "wind_speed": safe_float(weather.get("WindSpeed")),
        "wind_direction": safe_float(weather.get("WindDirection")),
        "precipitation": safe_float((weather.get("Now") or {}).get("Precipitation"), precipitation=True),
        "daily_high": safe_float(daily_high),
        "daily_low": safe_float(daily_low),
    }


def parse_rainfall(station: dict[str, Any]) -> dict[str, Any] | None:
    station_id = str(station.get("StationId") or station.get("StationID") or "").strip()
    station_name = str(station.get("StationName") or "").strip()
    observed_at = str((station.get("ObsTime") or {}).get("DateTime") or "").strip()
    if not station_id or not station_name or not observed_at:
        return None

    geo = station.get("GeoInfo") or {}
    weather = station.get("RainfallElement") or {}
    latitude, longitude = wgs84_coords(geo)
    hourly = safe_float((weather.get("Now") or {}).get("Precipitation"), precipitation=True)
    if hourly is None:
        hourly = safe_float((weather.get("Past1hr") or {}).get("Precipitation"), precipitation=True)
    daily = safe_float((weather.get("Past24hr") or {}).get("Precipitation"), precipitation=True)

    return {
        "station_id": station_id,
        "station_name": station_name,
        "observed_at": observed_at,
        "county": str(geo.get("CountyName") or "").strip(),
        "town": str(geo.get("TownName") or "").strip(),
        "latitude": latitude,
        "longitude": longitude,
        "hourly_rainfall": hourly,
        "daily_rainfall": daily,
    }


VALUE_FIELDS = {
    "Temperature": "temperature",
    "MaxTemperature": "max_temperature",
    "MinTemperature": "min_temperature",
    "ProbabilityOfPrecipitation": "precipitation_probability",
    "RelativeHumidity": "relative_humidity",
    "WindSpeed": "wind_speed",
    "BeaufortScale": "beaufort_scale",
    "WindDirection": "wind_direction",
    "Weather": "weather",
    "WeatherCode": "weather_code",
    "WeatherDescription": "description",
    "ComfortIndexDescription": "comfort",
    "UVIndex": "uv_index",
    "UVExposureLevel": "uv_level",
}

ELEMENT_FALLBACK = {
    "平均溫度": "temperature",
    "最高溫度": "max_temperature",
    "最低溫度": "min_temperature",
    "12小時降雨機率": "precipitation_probability",
    "降雨機率": "precipitation_probability",
    "平均相對濕度": "relative_humidity",
    "最大風速": "wind_speed",
    "平均風速": "wind_speed",
    "風向": "wind_direction",
    "天氣現象": "weather",
    "天氣預報綜合描述": "description",
}

NUMERIC_COLUMNS = {
    "latitude", "longitude", "temperature", "max_temperature", "min_temperature",
    "precipitation_probability", "relative_humidity", "wind_speed", "beaufort_scale", "uv_index",
}


def plain_value(val: Any) -> Any:
    if isinstance(val, dict):
        for candidate in ("value", "Value", "Measures", "Measure"):
            if candidate in val:
                return val[candidate]
    return val


def parse_forecast_payload(payload: dict[str, Any]) -> list[dict[str, Any]]:
    records = payload.get("records") or {}
    groups = []
    for key in ("Locations", "locations"):
        groups = [item for item in as_list(records.get(key)) if isinstance(item, dict)]
        if groups:
            break
    if not groups:
        groups = [records]

    rows: dict[tuple[str, str, str], dict[str, Any]] = defaultdict(dict)
    for group in groups:
        group_name = str(group.get("LocationsName") or group.get("locationsName") or "臺灣")
        locations = []
        for key in ("Location", "location"):
            locations = [item for item in as_list(group.get(key)) if isinstance(item, dict)]
            if locations:
                break
        for loc in locations:
            name = str(loc.get("LocationName") or loc.get("locationName") or "").strip()
            if not name:
                continue
            geocode = str(loc.get("Geocode") or loc.get("geocode") or "").strip()
            latitude = safe_float(loc.get("Latitude") or loc.get("latitude"))
            longitude = safe_float(loc.get("Longitude") or loc.get("longitude"))

            elements = []
            for key in ("WeatherElement", "weatherElement"):
                elements = [item for item in as_list(loc.get(key)) if isinstance(item, dict)]
                if elements:
                    break

            for el in elements:
                el_name = str(el.get("ElementName") or el.get("elementName") or "").strip()
                time_entries = []
                for key in ("Time", "time"):
                    time_entries = [item for item in as_list(el.get(key)) if isinstance(item, dict)]
                    if time_entries:
                        break
                for entry in time_entries:
                    start = str(entry.get("StartTime") or entry.get("startTime") or entry.get("DataTime") or entry.get("dataTime") or "")
                    end = str(entry.get("EndTime") or entry.get("endTime") or start)
                    if not start:
                        continue
                    key = (name, start, end)
                    row = rows[key]
                    row.update({
                        "locations_name": group_name,
                        "location_name": name,
                        "geocode": geocode,
                        "latitude": latitude,
                        "longitude": longitude,
                        "start_time": start,
                        "end_time": end,
                    })
                    raw_vals = entry.get("ElementValue") or entry.get("elementValue")
                    for vg in as_list(raw_vals):
                        if isinstance(vg, dict):
                            for sname, rval in vg.items():
                                tgt = VALUE_FIELDS.get(sname)
                                if tgt:
                                    row[tgt] = plain_value(rval)
                        elif vg is not None:
                            tgt = ELEMENT_FALLBACK.get(el_name)
                            if tgt:
                                row[tgt] = vg
                    fb_tgt = ELEMENT_FALLBACK.get(el_name)
                    if fb_tgt and fb_tgt not in row:
                        for k in ("Value", "value", "Measures"):
                            if k in entry:
                                row[fb_tgt] = plain_value(entry[k])
                                break

    forecast_columns = [
        "locations_name", "location_name", "geocode", "latitude", "longitude",
        "start_time", "end_time", "weather", "weather_code", "temperature",
        "max_temperature", "min_temperature", "precipitation_probability",
        "relative_humidity", "wind_direction", "wind_speed", "beaufort_scale",
        "comfort", "uv_index", "uv_level", "description",
    ]
    result = list(rows.values())
    for r in result:
        for col in NUMERIC_COLUMNS:
            if col in r:
                r[col] = safe_float(r[col])
        for col in forecast_columns:
            r.setdefault(col, None)
    return sorted(result, key=lambda x: (x["location_name"] or "", x["start_time"] or "", x["end_time"] or ""))


def sync_all() -> None:
    api_key = get_api_key()
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)

    print(f"[{datetime.now(TAIPEI_TZ).strftime('%Y-%m-%d %H:%M:%S')}] 開始同步中央氣象署最新氣象資料...")

    # 1. 取得觀測資料 O-A0001-001
    print("下載 O-A0001-001 (氣象測站觀測)...")
    obs_payload = fetch_cwa_dataset("O-A0001-001", api_key)
    obs_stations = find_stations(obs_payload.get("records", obs_payload))
    obs_rows = [parse_observation(s) for s in obs_stations]
    obs_rows = [r for r in obs_rows if r is not None]
    print(f"  -> 取得 {len(obs_rows)} 個測站即時資料")

    # 2. 取得雨量資料 O-A0002-001
    print("下載 O-A0002-001 (雨量測站觀測)...")
    rain_payload = fetch_cwa_dataset("O-A0002-001", api_key)
    rain_stations = find_stations(rain_payload.get("records", rain_payload))
    rain_rows = [parse_rainfall(s) for s in rain_stations]
    rain_rows = [r for r in rain_rows if r is not None]
    print(f"  -> 取得 {len(rain_rows)} 個雨量站即時資料")

    # 3. 取得預報資料 F-D0047-091
    print("下載 F-D0047-091 (一週預報)...")
    forecast_payload = fetch_cwa_dataset("F-D0047-091", api_key)
    forecast_rows = parse_forecast_payload(forecast_payload)
    print(f"  -> 取得 {len(forecast_rows)} 筆預報資料")

    # 4. 寫入 SQLite
    with sqlite3.connect(WEATHER_DB_PATH, timeout=30) as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS observations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id TEXT NOT NULL,
                station_name TEXT NOT NULL,
                observed_at TEXT NOT NULL,
                county TEXT,
                town TEXT,
                latitude REAL,
                longitude REAL,
                altitude REAL,
                weather TEXT,
                temperature REAL,
                humidity REAL,
                pressure REAL,
                wind_speed REAL,
                wind_direction REAL,
                precipitation REAL,
                daily_high REAL,
                daily_low REAL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(station_id, observed_at)
            )
        """)
        conn.execute("""
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
        """)
        conn.executemany("""
            INSERT INTO observations (
                station_id, station_name, observed_at, county, town,
                latitude, longitude, altitude, weather, temperature,
                humidity, pressure, wind_speed, wind_direction,
                precipitation, daily_high, daily_low
            ) VALUES (
                :station_id, :station_name, :observed_at, :county, :town,
                :latitude, :longitude, :altitude, :weather, :temperature,
                :humidity, :pressure, :wind_speed, :wind_direction,
                :precipitation, :daily_high, :daily_low
            )
            ON CONFLICT(station_id, observed_at) DO UPDATE SET
                station_name=excluded.station_name,
                county=excluded.county,
                town=excluded.town,
                latitude=excluded.latitude,
                longitude=excluded.longitude,
                altitude=excluded.altitude,
                weather=excluded.weather,
                temperature=excluded.temperature,
                humidity=excluded.humidity,
                pressure=excluded.pressure,
                wind_speed=excluded.wind_speed,
                wind_direction=excluded.wind_direction,
                precipitation=excluded.precipitation,
                daily_high=excluded.daily_high,
                daily_low=excluded.daily_low
        """, obs_rows)

        conn.executemany("""
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
                daily_rainfall=excluded.daily_rainfall
        """, rain_rows)
        conn.commit()

    with sqlite3.connect(FORECAST_DB_PATH, timeout=30) as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("DROP TABLE IF EXISTS forecast")
        conn.execute("""
            CREATE TABLE forecast (
                locations_name TEXT,
                location_name TEXT,
                geocode TEXT,
                latitude REAL,
                longitude REAL,
                start_time TEXT,
                end_time TEXT,
                weather TEXT,
                weather_code TEXT,
                temperature REAL,
                max_temperature REAL,
                min_temperature REAL,
                precipitation_probability REAL,
                relative_humidity REAL,
                wind_direction TEXT,
                wind_speed REAL,
                beaufort_scale REAL,
                comfort TEXT,
                uv_index REAL,
                uv_level TEXT,
                description TEXT
            )
        """)
        conn.executemany("""
            INSERT INTO forecast (
                locations_name, location_name, geocode, latitude, longitude,
                start_time, end_time, weather, weather_code, temperature,
                max_temperature, min_temperature, precipitation_probability,
                relative_humidity, wind_direction, wind_speed, beaufort_scale,
                comfort, uv_index, uv_level, description
            ) VALUES (
                :locations_name, :location_name, :geocode, :latitude, :longitude,
                :start_time, :end_time, :weather, :weather_code, :temperature,
                :max_temperature, :min_temperature, :precipitation_probability,
                :relative_humidity, :wind_direction, :wind_speed, :beaufort_scale,
                :comfort, :uv_index, :uv_level, :description
            )
        """, forecast_rows)
        conn.commit()

    # 5. 匯出 snapshot current-stations.json
    with sqlite3.connect(WEATHER_DB_PATH, timeout=30) as conn:
        conn.row_factory = sqlite3.Row
        snapshot_rows = conn.execute("""
            WITH latest_weather AS (
                SELECT station_id, MAX(observed_at) AS observed_at
                FROM observations
                GROUP BY station_id
            ),
            latest_rain AS (
                SELECT station_id, MAX(observed_at) AS observed_at
                FROM rainfall_observations
                GROUP BY station_id
            )
            SELECT
                o.station_id,
                o.station_name,
                o.observed_at AS time,
                o.county AS county_name,
                o.town AS town_name,
                o.latitude,
                o.longitude,
                o.altitude,
                o.weather,
                o.temperature,
                o.humidity,
                o.pressure,
                o.wind_speed,
                o.wind_direction,
                o.precipitation AS rainfall,
                o.daily_high,
                o.daily_low,
                r.hourly_rainfall AS rain_1h,
                r.daily_rainfall AS rain_daily
            FROM observations AS o
            INNER JOIN latest_weather AS lw
                ON lw.station_id = o.station_id
                AND lw.observed_at = o.observed_at
            LEFT JOIN latest_rain AS lr
                ON lr.station_id = o.station_id
            LEFT JOIN rainfall_observations AS r
                ON r.station_id = lr.station_id
                AND r.observed_at = lr.observed_at
            ORDER BY o.county, o.station_name
        """).fetchall()

    export_data = []
    for r in snapshot_rows:
        item = dict(r)
        item["id"] = item["station_id"]
        item["rain_3h"] = None
        item["rain_24h"] = item.get("rain_daily")
        export_data.append(item)

    payload = {
        "success": True,
        "count": len(export_data),
        "generated_at": datetime.now(TAIPEI_TZ).isoformat(timespec="seconds"),
        "source": "Central Weather Administration Open Data",
        "data": export_data,
        "forecast": forecast_rows,
    }

    SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
    temp_path = SNAPSHOT_PATH.with_suffix(".tmp")
    temp_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    temp_path.replace(SNAPSHOT_PATH)

    print(f"[{datetime.now(TAIPEI_TZ).strftime('%Y-%m-%d %H:%M:%S')}] 成功匯出 {len(export_data)} 個測站與 {len(forecast_rows)} 筆預報 -> {SNAPSHOT_PATH}")


if __name__ == "__main__":
    sync_all()
