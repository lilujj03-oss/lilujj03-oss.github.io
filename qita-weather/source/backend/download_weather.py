from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.common import RAW_OBSERVATION_PATH, atomic_write_json, fetch_cwa_dataset


DATASET_ID = "O-A0001-001"


def download_observation(output_path: Path = RAW_OBSERVATION_PATH) -> dict:
    payload = fetch_cwa_dataset(DATASET_ID)
    atomic_write_json(output_path, payload)
    return payload


def main() -> None:
    payload = download_observation()
    records = payload.get("records", {})
    station_count = len(records.get("Station", [])) if isinstance(records, dict) else 0
    print(
        f"[{datetime.now().isoformat(timespec='seconds')}] "
        f"已下載 {DATASET_ID}：{station_count} 個測站 -> {RAW_OBSERVATION_PATH}"
    )


if __name__ == "__main__":
    main()
