#!/usr/bin/env python3
"""Upload an image to Hedra as an asset and output the avatar_id for HEDRA_AVATAR_ID."""

import json
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

# Load .env.local from repo root
repo_root = Path(__file__).resolve().parent.parent
env_path = repo_root / ".env.local"
load_dotenv(env_path)

HEDRA_API_KEY = os.environ.get("HEDRA_API_KEY", "").strip()
BASE_URL = "https://api.hedra.com/web-app/public"


def create_asset(name: str) -> str:
    resp = requests.post(
        f"{BASE_URL}/assets",
        headers={
            "Content-Type": "application/json",
            "X-API-Key": HEDRA_API_KEY,
        },
        json={"name": name, "type": "image"},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["id"]


def upload_file(asset_id: str, file_path: Path) -> None:
    with open(file_path, "rb") as f:
        resp = requests.post(
            f"{BASE_URL}/assets/{asset_id}/upload",
            headers={"X-API-Key": HEDRA_API_KEY},
            files={"file": (file_path.name, f, "image/png")},
            timeout=60,
        )
    resp.raise_for_status()


def main() -> None:
    if not HEDRA_API_KEY:
        print("HEDRA_API_KEY not set in .env.local", file=sys.stderr)
        sys.exit(1)

    image_path = repo_root / "assets" / "avatar.png"
    if not image_path.exists():
        print(f"Image not found: {image_path}", file=sys.stderr)
        sys.exit(1)

    name = image_path.name
    print(f"Creating asset '{name}'...")
    asset_id = create_asset(name)
    print(f"Asset created: {asset_id}")

    print("Uploading image...")
    upload_file(asset_id, image_path)
    print("Upload complete.")

    env_file = repo_root / ".env.local"
    if env_file.exists():
        content = env_file.read_text()
        if "HEDRA_DEFAULT_AVATAR_ID=" in content:
            lines = []
            for line in content.splitlines():
                if line.strip().startswith("HEDRA_DEFAULT_AVATAR_ID="):
                    lines.append(f"HEDRA_DEFAULT_AVATAR_ID={asset_id}")
                else:
                    lines.append(line)
            env_file.write_text("\n".join(lines) + "\n")
            print(f"Updated HEDRA_DEFAULT_AVATAR_ID in {env_file}")
        else:
            with open(env_file, "a") as f:
                f.write(f"\nHEDRA_DEFAULT_AVATAR_ID={asset_id}\n")
            print(f"Added HEDRA_DEFAULT_AVATAR_ID to {env_file}")
    else:
        print(f"\nHEDRA_DEFAULT_AVATAR_ID={asset_id}")
        print("Add to your .env.local file.")


if __name__ == "__main__":
    main()
