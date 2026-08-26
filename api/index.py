"""Vercel FastAPI entrypoint for the Taiwan Trip weather proxy."""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from api._trip_weather import WeatherServiceError, fetch_weather


app = FastAPI(
    title="台灣好行氣象安全 API",
    description="在伺服器端代理並正規化中央氣象署 O-A0003-001 資料。",
    version="2.0.0",
    docs_url="/api/trip-weather/docs",
    redoc_url=None,
    openapi_url="/api/trip-weather/openapi.json",
    swagger_ui_oauth2_redirect_url="/api/trip-weather/docs/oauth2-redirect",
)


@app.get("/api/trip-weather")
def trip_weather() -> JSONResponse:
    try:
        payload = fetch_weather(os.getenv("CWA_API_KEY", ""))
    except WeatherServiceError as error:
        return JSONResponse(
            status_code=error.status_code,
            content={
                "success": False,
                "error": error.code,
                "message": error.message,
                "fallbackAllowed": True,
            },
            headers={"Cache-Control": "no-store"},
        )

    return JSONResponse(
        content=payload,
        headers={
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            "X-Content-Type-Options": "nosniff",
        },
    )


@app.get("/api/trip-weather/health")
def trip_weather_health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "taiwan-trip-weather",
        "cwaKeyConfigured": bool(os.getenv("CWA_API_KEY", "").strip()),
    }
