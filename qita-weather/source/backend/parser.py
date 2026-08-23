from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path
from typing import Any

import pandas as pd

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.common import (
    RAW_OBSERVATION_PATH,
    WEATHER_CSV_PATH,
    WEATHER_DB_PATH,
    as_list,
    ensure_directories,
    safe_float,
)


OBSERVATION_COLUMNS = [
    "station_id",
    "station_name",
    "observed_at",
    "county",
    "town",
    "latitude",
    "longitude",
    "altitude",
    "weather",
    "temperature",
    "humidity",
    "pressure",
    "wind_speed",
    "wind_direction",
    "precipitation",
    "daily_high",
    "daily_low",
]


def ensure_schema(connection: sqlite3.Connection | None = None) -> None:
    owns_connection = connection is None
    if connection is None:
        ensure_directories()
        connection = sqlite3.connect(WEATHER_DB_PATH)
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute(
        """
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
        """
    )
    connection.execute(
        "CREATE INDEX IF NOT EXISTS idx_observations_station_time "
        "ON observations(station_id, observed_at DESC)"
    )
    connection.execute(
        "CREATE INDEX IF NOT EXISTS idx_observations_county ON observations(county)"
    )
    connection.commit()
    if owns_connection:
        connection.close()


def _find_stations(node: Any) -> list[dict[str, Any]]:
    if isinstance(node, dict):
        for key in ("Station", "station"):
            if key in node:
                values = [item for item in as_list(node[key]) if isinstance(item, dict)]
                if values:
                    return values
        for value in node.values():
            found = _find_stations(value)
            if found:
                return found
    elif isinstance(node, list):
        for item in node:
            found = _find_stations(item)
            if found:
                return found
    return []


def _wgs84_coordinates(geo: dict[str, Any]) -> tuple[float | None, float | None]:
    coordinates = [item for item in as_list(geo.get("Coordinates")) if isinstance(item, dict)]
    selected = next(
        (
            item
            for item in coordinates
            if str(item.get("CoordinateName", "")).upper() == "WGS84"
        ),
        coordinates[-1] if coordinates else {},
    )
    return (
        safe_float(selected.get("StationLatitude")),
        safe_float(selected.get("StationLongitude")),
    )


def _clean_weather(value: Any) -> str | None:
    text = str(value or "").strip()
    return None if text.upper() in {"", "-99", "X"} else text


def parse_station(station: dict[str, Any]) -> dict[str, Any] | None:
    station_id = str(station.get("StationId") or station.get("StationID") or "").strip()
    station_name = str(station.get("StationName") or "").strip()
    observed_at = str((station.get("ObsTime") or {}).get("DateTime") or "").strip()
    if not station_id or not station_name or not observed_at:
        return None

    geo = station.get("GeoInfo") or {}
    weather = station.get("WeatherElement") or {}
    latitude, longitude = _wgs84_coordinates(geo)
    daily_extreme = weather.get("DailyExtreme") or {}
    daily_high = (
        (daily_extreme.get("DailyHigh") or {}).get("TemperatureInfo") or {}
    ).get("AirTemperature")
    daily_low = (
        (daily_extreme.get("DailyLow") or {}).get("TemperatureInfo") or {}
    ).get("AirTemperature")

    return {
        "station_id": station_id,
        "station_name": station_name,
        "observed_at": observed_at,
        "county": str(geo.get("CountyName") or "").strip(),
        "town": str(geo.get("TownName") or "").strip(),
        "latitude": latitude,
        "longitude": longitude,
        "altitude": safe_float(geo.get("StationAltitude")),
        "weather": _clean_weather(weather.get("Weather")),
        "temperature": safe_float(weather.get("AirTemperature")),
        "humidity": safe_float(weather.get("RelativeHumidity")),
        "pressure": safe_float(weather.get("AirPressure")),
        "wind_speed": safe_float(weather.get("WindSpeed")),
        "wind_direction": safe_float(weather.get("WindDirection")),
        "precipitation": safe_float(
            (weather.get("Now") or {}).get("Precipitation"), precipitation=True
        ),
        "daily_high": safe_float(daily_high),
        "daily_low": safe_float(daily_low),
    }


def parse_payload(payload: dict[str, Any]) -> list[dict[str, Any]]:
    stations = _find_stations(payload.get("records", payload))
    parsed = [parse_station(station) for station in stations]
    return [row for row in parsed if row is not None]


def store_observations(rows: list[dict[str, Any]]) -> int:
    ensure_directories()
    with sqlite3.connect(WEATHER_DB_PATH, timeout=30) as connection:
        ensure_schema(connection)
        connection.executemany(
            """
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
            """,
            rows,
        )
        connection.commit()
        history = pd.read_sql_query(
            "SELECT " + ", ".join(OBSERVATION_COLUMNS) +
            " FROM observations ORDER BY observed_at, station_id",
            connection,
        )
    history.to_csv(WEATHER_CSV_PATH, index=False, encoding="utf-8-sig")
    return len(rows)


def parse_file(input_path: Path = RAW_OBSERVATION_PATH) -> int:
    if not input_path.exists():
        raise FileNotFoundError(f"找不到觀測原始檔：{input_path}")
    payload = json.loads(input_path.read_text(encoding="utf-8"))
    rows = parse_payload(payload)
    if not rows:
        raise ValueError("原始 JSON 中找不到有效的 O-A0001-001 測站資料")
    return store_observations(rows)


def main() -> None:
    count = parse_file()
    print(f"已解析並寫入 {count} 筆測站資料")
    print(f"CSV：{WEATHER_CSV_PATH}")
    print(f"SQLite：{WEATHER_DB_PATH}")


if __name__ == "__main__":
    main()
