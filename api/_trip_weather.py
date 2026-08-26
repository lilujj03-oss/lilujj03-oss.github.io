"""CWA weather client and response normalizer for Taiwan Trip.

This module intentionally has no framework dependency so the data conversion can
be unit-tested without starting a web server. Vercel imports it from api/index.py.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from math import isfinite
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


DATASET_ID = "O-A0003-001"
CWA_ENDPOINT = f"https://opendata.cwa.gov.tw/api/v1/rest/datastore/{DATASET_ID}"
REQUEST_TIMEOUT_SECONDS = 10


@dataclass(slots=True)
class WeatherServiceError(Exception):
    """A safe, user-facing error raised by the upstream weather service."""

    code: str
    message: str
    status_code: int

    def __str__(self) -> str:
        return self.message


def _number(
    value: Any,
    *,
    minimum: float | None = None,
    maximum: float | None = None,
) -> float | None:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    if not isfinite(result):
        return None
    if minimum is not None and result < minimum:
        return None
    if maximum is not None and result > maximum:
        return None
    return result


def _rounded(value: float | None, digits: int = 1) -> float | None:
    return round(value, digits) if value is not None else None


def _coordinate(geo: dict[str, Any], key: str) -> float | None:
    coordinates = geo.get("Coordinates") or []
    if isinstance(coordinates, dict):
        coordinates = [coordinates]
    if not isinstance(coordinates, list):
        return None

    selected: dict[str, Any] | None = None
    for item in coordinates:
        if not isinstance(item, dict):
            continue
        if str(item.get("CoordinateName", "")).upper() == "WGS84":
            selected = item
            break
        if selected is None:
            selected = item
    if not selected:
        return None
    if key == "StationLatitude":
        return _number(selected.get(key), minimum=-90, maximum=90)
    return _number(selected.get(key), minimum=-180, maximum=180)


def _daily_temperature(weather: dict[str, Any], period: str) -> float | None:
    daily_extreme = weather.get("DailyExtreme") or {}
    period_data = daily_extreme.get(period) or {}
    temperature_info = period_data.get("TemperatureInfo") or {}
    return _number(
        temperature_info.get("AirTemperature"),
        minimum=-50,
        maximum=60,
    )


def normalize_station(station: dict[str, Any]) -> dict[str, Any] | None:
    """Convert a CWA O-A0003-001 station into the public API schema."""

    if not isinstance(station, dict):
        return None

    station_id = str(station.get("StationId") or "").strip()
    station_name = str(station.get("StationName") or "").strip()
    geo = station.get("GeoInfo") or {}
    weather = station.get("WeatherElement") or {}
    if not isinstance(geo, dict) or not isinstance(weather, dict):
        return None

    latitude = _coordinate(geo, "StationLatitude")
    longitude = _coordinate(geo, "StationLongitude")
    if latitude is None:
        latitude = _number(station.get("StationLatitude"), minimum=-90, maximum=90)
    if longitude is None:
        longitude = _number(station.get("StationLongitude"), minimum=-180, maximum=180)

    temperature = _number(
        weather.get("AirTemperature"),
        minimum=-50,
        maximum=60,
    )
    if not station_id or not station_name or latitude is None or longitude is None:
        return None
    if latitude == 0 or longitude == 0 or temperature is None:
        return None

    now = weather.get("Now") or {}
    precipitation_value = now.get("Precipitation") if isinstance(now, dict) else None
    if precipitation_value is None:
        precipitation_value = weather.get("Precipitation")

    precipitation = _number(precipitation_value, minimum=0)
    humidity = _number(weather.get("RelativeHumidity"), minimum=0, maximum=100)
    wind_speed = _number(weather.get("WindSpeed"), minimum=0)
    wind_direction = _number(weather.get("WindDirection"), minimum=0, maximum=360)
    pressure = _number(weather.get("AirPressure"), minimum=0)
    uv_index = _number(weather.get("UVIndex"), minimum=0)

    weather_text = str(weather.get("Weather") or "").strip()
    if weather_text in {"", "-99"}:
        weather_text = "目前無天氣現象描述"

    observation = station.get("ObsTime") or {}
    observed_at = observation.get("DateTime") if isinstance(observation, dict) else None

    return {
        "stationId": station_id,
        "stationName": station_name,
        "latitude": _rounded(latitude, 6),
        "longitude": _rounded(longitude, 6),
        "county": str(geo.get("CountyName") or station.get("CountyName") or "").strip(),
        "town": str(geo.get("TownName") or station.get("TownName") or "").strip(),
        "temperature": _rounded(temperature),
        "humidity": round(humidity) if humidity is not None else None,
        "precipitation": _rounded(precipitation),
        "windSpeed": _rounded(wind_speed),
        "windDirection": round(wind_direction) if wind_direction is not None else None,
        "pressure": _rounded(pressure),
        "weatherText": weather_text,
        "uvIndex": _rounded(uv_index),
        "dailyHigh": _rounded(_daily_temperature(weather, "DailyHigh")),
        "dailyLow": _rounded(_daily_temperature(weather, "DailyLow")),
        "observedAt": str(observed_at).strip() if observed_at else None,
    }


def normalize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    records = payload.get("records") or {}
    raw_stations = records.get("Station") if isinstance(records, dict) else None
    if not isinstance(raw_stations, list) or not raw_stations:
        raise WeatherServiceError(
            "UPSTREAM_FORMAT_ERROR",
            "中央氣象署暫時沒有可用的測站資料。",
            502,
        )

    stations = [normalized for item in raw_stations if (normalized := normalize_station(item))]
    if not stations:
        raise WeatherServiceError(
            "UPSTREAM_FORMAT_ERROR",
            "中央氣象署測站資料格式暫時無法使用。",
            502,
        )

    observed_times = [item["observedAt"] for item in stations if item["observedAt"]]
    return {
        "success": True,
        "source": "cwa-live",
        "datasetId": DATASET_ID,
        "updatedAt": max(observed_times) if observed_times else None,
        "count": len(stations),
        "skippedCount": len(raw_stations) - len(stations),
        "stations": stations,
    }


def fetch_weather(
    api_key: str,
    *,
    opener: Callable[..., Any] = urlopen,
) -> dict[str, Any]:
    """Fetch and normalize CWA data without ever returning the API key."""

    if not api_key.strip():
        raise WeatherServiceError(
            "CONFIG_MISSING",
            "即時氣象服務尚未完成設定，網站將使用備援資料。",
            503,
        )

    query = urlencode({"Authorization": api_key.strip(), "format": "JSON"})
    request = Request(
        f"{CWA_ENDPOINT}?{query}",
        headers={
            "Accept": "application/json",
            "User-Agent": "taiwan-trip-weather/2.0",
        },
    )

    try:
        with opener(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            raw_body = response.read()
    except HTTPError as error:
        raise WeatherServiceError(
            "UPSTREAM_HTTP_ERROR",
            "中央氣象署目前無法回應，網站將使用備援資料。",
            502,
        ) from error
    except (URLError, TimeoutError, OSError) as error:
        raise WeatherServiceError(
            "UPSTREAM_UNAVAILABLE",
            "中央氣象署連線逾時，網站將使用備援資料。",
            504,
        ) from error

    try:
        payload = json.loads(raw_body)
    except (TypeError, ValueError, UnicodeDecodeError) as error:
        raise WeatherServiceError(
            "UPSTREAM_INVALID_JSON",
            "中央氣象署回傳了無法解析的資料。",
            502,
        ) from error
    if not isinstance(payload, dict):
        raise WeatherServiceError(
            "UPSTREAM_INVALID_JSON",
            "中央氣象署回傳了無法解析的資料。",
            502,
        )
    return normalize_payload(payload)
