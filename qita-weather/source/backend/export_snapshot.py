from __future__ import annotations

import json
import sqlite3
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.common import FORECAST_DB_PATH, WEATHER_DB_PATH


TAIPEI_TZ = timezone(timedelta(hours=8))


def _forecast_snapshot() -> list[dict[str, Any]]:
    if not FORECAST_DB_PATH.exists():
        return []
    try:
        with sqlite3.connect(FORECAST_DB_PATH, timeout=30) as connection:
            connection.row_factory = sqlite3.Row
            rows = connection.execute(
                "SELECT * FROM forecast ORDER BY location_name, start_time"
            ).fetchall()
    except sqlite3.Error:
        return []
    return [dict(row) for row in rows]


def export_snapshot(output_path: Path) -> int:
    """Export the latest observation for every station as a public fallback file."""
    with sqlite3.connect(WEATHER_DB_PATH, timeout=30) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
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
            """
        ).fetchall()

    data: list[dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        item["id"] = item["station_id"]
        item["rain_3h"] = None
        item["rain_24h"] = item.get("rain_daily")
        data.append(item)

    payload = {
        "success": True,
        "count": len(data),
        "generated_at": datetime.now(TAIPEI_TZ).isoformat(timespec="seconds"),
        "source": "Local SQLite fallback snapshot",
        "data": data,
        "forecast": _forecast_snapshot(),
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = output_path.with_suffix(output_path.suffix + ".tmp")
    temporary_path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    temporary_path.replace(output_path)
    return len(data)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("用法：python backend/export_snapshot.py <輸出 JSON 路徑>")
    output_path = Path(sys.argv[1]).expanduser().resolve()
    count = export_snapshot(output_path)
    print(f"已匯出 {count} 個測站：{output_path}")


if __name__ == "__main__":
    main()
