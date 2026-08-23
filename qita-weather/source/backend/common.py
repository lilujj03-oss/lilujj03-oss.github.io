from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parent.parent
DATABASE_DIR = ROOT_DIR / "database"
FRONTEND_DIR = ROOT_DIR / "frontend"
RAW_OBSERVATION_PATH = DATABASE_DIR / "raw_obs.json"
RAW_RAINFALL_PATH = DATABASE_DIR / "raw_rainfall.json"
WEATHER_CSV_PATH = DATABASE_DIR / "weather.csv"
WEATHER_DB_PATH = DATABASE_DIR / "weather.db"
FORECAST_RAW_PATH = ROOT_DIR / "F-D0047-091_raw.json"
FORECAST_CSV_PATH = ROOT_DIR / "F-D0047-091_parsed.csv"
FORECAST_DB_PATH = ROOT_DIR / "F-D0047-091_parsed.db"

load_dotenv(ROOT_DIR / ".env")


def ensure_directories() -> None:
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)


def get_api_key(required: bool = True) -> str:
    """Read the CWA authorization key from .env, then config.json as fallback."""
    key = os.getenv("CWA_API_KEY", "").strip()
    if not key:
        config_path = ROOT_DIR / "config.json"
        if config_path.exists():
            try:
                config = json.loads(config_path.read_text(encoding="utf-8"))
                key = str(config.get("CWA_API_KEY", "")).strip()
            except (OSError, json.JSONDecodeError):
                key = ""
    if required and not key:
        raise RuntimeError(
            "尚未設定 CWA_API_KEY。請在專案根目錄的 .env 填入中央氣象署 API 授權碼。"
        )
    return key


def redact_sensitive_text(value: object) -> str:
    """Remove the CWA authorization key from errors before returning them to clients."""
    text = str(value)
    key = get_api_key(required=False)
    if key:
        text = text.replace(key, "***")
    return re.sub(
        r"(?i)(Authorization(?:=|%3D))[^&\s]+",
        r"\1***",
        text,
    )


def fetch_cwa_dataset(dataset_id: str, extra_params: dict[str, Any] | None = None) -> dict[str, Any]:
    """Fetch a JSON dataset from the official CWA Open Data REST API."""
    base_url = os.getenv(
        "CWA_BASE_URL",
        "https://opendata.cwa.gov.tw/api/v1/rest/datastore",
    ).rstrip("/")
    params: dict[str, Any] = {
        "Authorization": get_api_key(),
        "format": "JSON",
    }
    if extra_params:
        params.update(extra_params)

    response = requests.get(
        f"{base_url}/{dataset_id}",
        params=params,
        timeout=(10, 60),
        headers={"User-Agent": "CWA-Weather-Dashboard/1.0"},
    )
    response.raise_for_status()
    payload = response.json()
    if str(payload.get("success", "true")).lower() != "true":
        message = payload.get("result", {}).get("message") or payload.get("message")
        raise RuntimeError(f"中央氣象署 API 回傳失敗：{message or '未知錯誤'}")
    return payload


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    ensure_directories()
    temp_path = path.with_suffix(path.suffix + ".tmp")
    temp_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temp_path.replace(path)


def as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def safe_float(value: Any, *, precipitation: bool = False) -> float | None:
    """Convert CWA numeric values while handling documented missing-value codes."""
    if value is None:
        return None
    text = str(value).strip()
    if precipitation and text.upper() in {"T", "-98"}:
        return 0.0
    if not text or text.upper() in {"X", "-99", "-999", "NULL", "NONE"}:
        return None
    try:
        number = float(text)
    except (TypeError, ValueError):
        return None
    if number <= -90:
        return 0.0 if precipitation and number == -98 else None
    return number
