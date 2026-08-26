from __future__ import annotations

import json
import os
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch
from urllib.error import URLError

from api._trip_weather import WeatherServiceError, fetch_weather, normalize_payload
from api.trip_weather import handler as WeatherHandler
from api.trip_weather_health import handler as HealthHandler


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
    def run_handler(self, handler_class: type) -> tuple[int, dict[str, str], dict[str, object]]:
        instance = handler_class.__new__(handler_class)
        instance.wfile = BytesIO()
        response: dict[str, object] = {"status": 0, "headers": {}}
        instance.send_response = lambda status: response.update(status=status)
        instance.send_header = lambda key, value: response["headers"].update({key: value})
        instance.end_headers = lambda: None

        instance.do_GET()

        body = json.loads(instance.wfile.getvalue())
        return int(response["status"]), response["headers"], body

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

    def test_weather_handler_returns_safe_fallback_error_without_key(self) -> None:
        with patch.dict(os.environ, {"CWA_API_KEY": ""}, clear=False):
            status, headers, payload = self.run_handler(WeatherHandler)

        self.assertEqual(status, 503)
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertTrue(payload["fallbackAllowed"])
        self.assertNotIn("CWA_API_KEY", json.dumps(payload))

    def test_weather_handler_returns_cacheable_normalized_payload(self) -> None:
        normalized = normalize_payload({"records": {"Station": [SAMPLE_STATION]}})
        with patch("api.trip_weather.fetch_weather", return_value=normalized):
            status, headers, payload = self.run_handler(WeatherHandler)

        self.assertEqual(status, 200)
        self.assertEqual(payload["count"], 1)
        self.assertEqual(headers["Vercel-CDN-Cache-Control"], "max-age=300, stale-while-revalidate=600")

    def test_health_handler_reports_configuration_without_revealing_key(self) -> None:
        with patch.dict(os.environ, {"CWA_API_KEY": "test-secret-not-real"}, clear=False):
            status, headers, payload = self.run_handler(HealthHandler)

        self.assertEqual(status, 200)
        self.assertTrue(payload["cwaKeyConfigured"])
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertNotIn("test-secret-not-real", json.dumps(payload))


if __name__ == "__main__":
    unittest.main()
