from __future__ import annotations

import json
import unittest
from pathlib import Path
from urllib.error import URLError

from api._trip_weather import WeatherServiceError, fetch_weather, normalize_payload


SAMPLE_STATION = {
    "StationName": "臺北",
    "StationId": "466920",
    "ObsTime": {"DateTime": "2026-08-26T12:00:00+08:00"},
    "GeoInfo": {
        "Coordinates": [
            {
                "CoordinateName": "TWD67",
                "StationLatitude": "25.035",
                "StationLongitude": "121.506",
            },
            {
                "CoordinateName": "WGS84",
                "StationLatitude": "25.037658",
                "StationLongitude": "121.514853",
            },
        ],
        "CountyName": "臺北市",
        "TownName": "中正區",
    },
    "WeatherElement": {
        "AirTemperature": "31.2",
        "RelativeHumidity": "68",
        "Now": {"Precipitation": "0.5"},
        "WindSpeed": "2.4",
        "WindDirection": "80",
        "AirPressure": "1002.3",
        "Weather": "多雲",
        "UVIndex": "6",
        "DailyExtreme": {
            "DailyHigh": {"TemperatureInfo": {"AirTemperature": "33.1"}},
            "DailyLow": {"TemperatureInfo": {"AirTemperature": "25.2"}},
        },
    },
}


class FakeResponse:
    def __init__(self, payload: dict[str, object]) -> None:
        self._body = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def read(self) -> bytes:
        return self._body


class TripWeatherTests(unittest.TestCase):
    def test_normalizes_cwa_station_and_prefers_wgs84(self) -> None:
        payload = normalize_payload({"records": {"Station": [SAMPLE_STATION]}})

        self.assertTrue(payload["success"])
        self.assertEqual(payload["count"], 1)
        station = payload["stations"][0]
        self.assertEqual(station["stationId"], "466920")
        self.assertEqual(station["latitude"], 25.037658)
        self.assertEqual(station["longitude"], 121.514853)
        self.assertEqual(station["temperature"], 31.2)
        self.assertEqual(station["precipitation"], 0.5)
        self.assertEqual(station["dailyHigh"], 33.1)

    def test_skips_station_without_valid_location(self) -> None:
        invalid = {**SAMPLE_STATION, "StationId": "invalid", "GeoInfo": {}}
        payload = normalize_payload(
            {"records": {"Station": [SAMPLE_STATION, invalid]}}
        )

        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["skippedCount"], 1)

    def test_skips_non_finite_temperature(self) -> None:
        invalid = {
            **SAMPLE_STATION,
            "StationId": "invalid-temperature",
            "WeatherElement": {**SAMPLE_STATION["WeatherElement"], "AirTemperature": "NaN"},
        }
        payload = normalize_payload(
            {"records": {"Station": [SAMPLE_STATION, invalid]}}
        )

        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["skippedCount"], 1)

    def test_fetches_with_secret_but_never_returns_it(self) -> None:
        secret = "test-secret-not-real"
        seen_url = ""

        def opener(request: object, timeout: int) -> FakeResponse:
            nonlocal seen_url
            seen_url = request.full_url  # type: ignore[attr-defined]
            self.assertEqual(timeout, 10)
            return FakeResponse({"records": {"Station": [SAMPLE_STATION]}})

        payload = fetch_weather(secret, opener=opener)

        self.assertIn(secret, seen_url)
        self.assertNotIn(secret, json.dumps(payload, ensure_ascii=False))

    def test_missing_key_returns_safe_configuration_error(self) -> None:
        with self.assertRaises(WeatherServiceError) as raised:
            fetch_weather(" ")

        self.assertEqual(raised.exception.code, "CONFIG_MISSING")
        self.assertEqual(raised.exception.status_code, 503)

    def test_network_error_returns_safe_upstream_error(self) -> None:
        def opener(request: object, timeout: int) -> FakeResponse:
            raise URLError("network down")

        with self.assertRaises(WeatherServiceError) as raised:
            fetch_weather("test-secret-not-real", opener=opener)

        self.assertEqual(raised.exception.code, "UPSTREAM_UNAVAILABLE")
        self.assertNotIn("network down", raised.exception.message)

    def test_frontend_does_not_contain_cwa_authorization_key(self) -> None:
        root = Path(__file__).resolve().parents[1]
        frontend = (root / "taiwan-trip-weather" / "js" / "weather-api.js").read_text(
            encoding="utf-8"
        )

        self.assertNotIn("Authorization=", frontend)
        self.assertNotIn("defaultApiKey", frontend)


if __name__ == "__main__":
    unittest.main()
