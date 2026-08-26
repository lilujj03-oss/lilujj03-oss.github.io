"""Vercel Function that serves normalized Taiwan Trip weather data."""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler
from typing import Any

from api._trip_weather import WeatherServiceError, fetch_weather


class handler(BaseHTTPRequestHandler):
    def _send_json(
        self,
        status_code: int,
        payload: dict[str, Any],
        *,
        cache_control: str,
        vercel_cache_control: str | None = None,
    ) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache_control)
        if vercel_cache_control:
            self.send_header("Vercel-CDN-Cache-Control", vercel_cache_control)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        try:
            payload = fetch_weather(os.getenv("CWA_API_KEY", ""))
        except WeatherServiceError as error:
            self._send_json(
                error.status_code,
                {
                    "success": False,
                    "error": error.code,
                    "message": error.message,
                    "fallbackAllowed": True,
                },
                cache_control="no-store",
            )
            return

        self._send_json(
            200,
            payload,
            cache_control="public, max-age=60",
            vercel_cache_control="max-age=300, stale-while-revalidate=600",
        )
