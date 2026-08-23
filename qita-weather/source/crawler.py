from __future__ import annotations

import json
import re
import sqlite3
from collections import defaultdict
from pathlib import Path
from typing import Any

import pandas as pd

from backend.common import (
    FORECAST_CSV_PATH,
    FORECAST_DB_PATH,
    FORECAST_RAW_PATH,
    as_list,
    atomic_write_json,
    fetch_cwa_dataset,
    safe_float,
)


DATASET_ID = "F-D0047-091"

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

NUMERIC_COLUMNS = {
    "latitude",
    "longitude",
    "temperature",
    "max_temperature",
    "min_temperature",
    "precipitation_probability",
    "relative_humidity",
    "wind_speed",
    "beaufort_scale",
    "uv_index",
}


def _groups(records: dict[str, Any]) -> list[dict[str, Any]]:
    for key in ("Locations", "locations"):
        groups = [item for item in as_list(records.get(key)) if isinstance(item, dict)]
        if groups:
            return groups
    return [records]


def _locations(group: dict[str, Any]) -> list[dict[str, Any]]:
    for key in ("Location", "location"):
        values = [item for item in as_list(group.get(key)) if isinstance(item, dict)]
        if values:
            return values
    return []


def _elements(location: dict[str, Any]) -> list[dict[str, Any]]:
    for key in ("WeatherElement", "weatherElement"):
        values = [item for item in as_list(location.get(key)) if isinstance(item, dict)]
        if values:
            return values
    return []


def _time_entries(element: dict[str, Any]) -> list[dict[str, Any]]:
    for key in ("Time", "time"):
        return [item for item in as_list(element.get(key)) if isinstance(item, dict)]
    return []


def _plain_value(value: Any) -> Any:
    if isinstance(value, dict):
        for candidate in ("value", "Value", "Measures", "Measure"):
            if candidate in value:
                return value[candidate]
    return value


def _extract_values(time_entry: dict[str, Any], element_name: str) -> dict[str, Any]:
    result: dict[str, Any] = {}
    raw_values = time_entry.get("ElementValue") or time_entry.get("elementValue")
    for value_group in as_list(raw_values):
        if isinstance(value_group, dict):
            for source_name, raw_value in value_group.items():
                target = VALUE_FIELDS.get(source_name)
                if target:
                    result[target] = _plain_value(raw_value)
        elif value_group is not None:
            target = ELEMENT_FALLBACK.get(element_name)
            if target:
                result[target] = value_group

    fallback_target = ELEMENT_FALLBACK.get(element_name)
    if fallback_target and fallback_target not in result:
        for key in ("Value", "value", "Measures"):
            if key in time_entry:
                result[fallback_target] = _plain_value(time_entry[key])
                break
    return result


def _numeric(value: Any) -> float | None:
    direct = safe_float(value)
    if direct is not None:
        return direct
    match = re.search(r"-?\d+(?:\.\d+)?", str(value or ""))
    return float(match.group()) if match else None


def parse_forecast(payload: dict[str, Any]) -> list[dict[str, Any]]:
    records = payload.get("records") or {}
    rows: dict[tuple[str, str, str], dict[str, Any]] = defaultdict(dict)

    for group in _groups(records):
        group_name = str(group.get("LocationsName") or group.get("locationsName") or "臺灣")
        for location in _locations(group):
            name = str(location.get("LocationName") or location.get("locationName") or "").strip()
            if not name:
                continue
            geocode = str(location.get("Geocode") or location.get("geocode") or "").strip()
            latitude = _numeric(location.get("Latitude") or location.get("latitude"))
            longitude = _numeric(location.get("Longitude") or location.get("longitude"))

            for element in _elements(location):
                element_name = str(element.get("ElementName") or element.get("elementName") or "").strip()
                for time_entry in _time_entries(element):
                    start = str(
                        time_entry.get("StartTime")
                        or time_entry.get("startTime")
                        or time_entry.get("DataTime")
                        or time_entry.get("dataTime")
                        or ""
                    )
                    end = str(time_entry.get("EndTime") or time_entry.get("endTime") or start)
                    if not start:
                        continue
                    key = (name, start, end)
                    row = rows[key]
                    row.update(
                        {
                            "locations_name": group_name,
                            "location_name": name,
                            "geocode": geocode,
                            "latitude": latitude,
                            "longitude": longitude,
                            "start_time": start,
                            "end_time": end,
                        }
                    )
                    row.update(_extract_values(time_entry, element_name))

    result = list(rows.values())
    for row in result:
        for column in NUMERIC_COLUMNS:
            if column in row:
                row[column] = _numeric(row[column])
    return sorted(result, key=lambda row: (row["location_name"], row["start_time"], row["end_time"]))


def store_forecast(rows: list[dict[str, Any]]) -> int:
    if not rows:
        raise ValueError("F-D0047-091 回應中找不到可解析的預報資料")
    dataframe = pd.DataFrame(rows)
    preferred = [
        "locations_name", "location_name", "geocode", "latitude", "longitude",
        "start_time", "end_time", "weather", "weather_code", "temperature",
        "max_temperature", "min_temperature", "precipitation_probability",
        "relative_humidity", "wind_direction", "wind_speed", "beaufort_scale",
        "comfort", "uv_index", "uv_level", "description",
    ]
    dataframe = dataframe.reindex(columns=[column for column in preferred if column in dataframe.columns])
    dataframe.to_csv(FORECAST_CSV_PATH, index=False, encoding="utf-8-sig")
    with sqlite3.connect(FORECAST_DB_PATH) as connection:
        dataframe.to_sql("forecast", connection, if_exists="replace", index=False)
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_forecast_location_time "
            "ON forecast(location_name, start_time)"
        )
        connection.commit()
    return len(dataframe)


def run_forecast_update() -> int:
    payload = fetch_cwa_dataset(DATASET_ID)
    atomic_write_json(FORECAST_RAW_PATH, payload)
    return store_forecast(parse_forecast(payload))


def main() -> None:
    count = run_forecast_update()
    print(f"已更新 {DATASET_ID}：{count} 筆逐 12 小時預報")
    print(f"原始 JSON：{FORECAST_RAW_PATH}")
    print(f"CSV：{FORECAST_CSV_PATH}")
    print(f"SQLite：{FORECAST_DB_PATH}")


if __name__ == "__main__":
    main()
