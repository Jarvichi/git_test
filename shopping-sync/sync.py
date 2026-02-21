#!/usr/bin/env python3
"""
sync.py — Sainsbury's Shopping Sync

Reads incomplete items from an Apple Reminders list (via iCloud CalDAV),
adds them to your next Sainsbury's delivery, and marks them as completed.

Usage:
    python sync.py               # Run sync
    python sync.py --dry-run     # Show what would be synced, don't touch Sainsbury's
"""

from __future__ import annotations

import os
import sys
from dotenv import load_dotenv

from reminders import get_client, get_shopping_items, mark_complete
from sainsburys import SainsburysClient


def main() -> int:
    load_dotenv()

    dry_run = "--dry-run" in sys.argv

    # ── Credentials ────────────────────────────────────────────────────────
    missing = []
    for key in ("APPLE_ID", "APPLE_APP_PASSWORD", "SAINSBURYS_EMAIL", "SAINSBURYS_PASSWORD"):
        if not os.environ.get(key):
            missing.append(key)
    if missing:
        print("ERROR: Missing required environment variables:")
        for key in missing:
            print(f"  {key}")
        print("\nCopy .env.example to .env and fill in your credentials.")
        return 1

    apple_id = os.environ["APPLE_ID"]
    apple_app_password = os.environ["APPLE_APP_PASSWORD"]
    sainsburys_email = os.environ["SAINSBURYS_EMAIL"]
    sainsburys_password = os.environ["SAINSBURYS_PASSWORD"]
    list_name = os.environ.get("REMINDERS_LIST_NAME", "Shopping List")

    # ── Step 1: Read Reminders ─────────────────────────────────────────────
    print(f"[1/3] Fetching items from Reminders list: '{list_name}'")
    try:
        client = get_client(apple_id, apple_app_password)
        todo_items = get_shopping_items(client, list_name)
    except ValueError as exc:
        print(f"ERROR: {exc}")
        return 1
    except Exception as exc:
        print(f"ERROR reading from iCloud: {exc}")
        print("Check your APPLE_ID and APPLE_APP_PASSWORD.")
        return 1

    if not todo_items:
        print("  Shopping list is empty — nothing to sync.")
        return 0

    print(f"  Found {len(todo_items)} item(s):")
    for _, summary in todo_items:
        print(f"    · {summary}")

    if dry_run:
        print("\n[DRY RUN] Skipping Sainsbury's and Reminders update.")
        return 0

    # ── Step 2: Add to Sainsbury's ─────────────────────────────────────────
    print(f"\n[2/3] Adding items to Sainsbury's trolley")
    sainsburys = SainsburysClient(
        email=sainsburys_email,
        password=sainsburys_password,
    )
    item_names = [summary for _, summary in todo_items]
    try:
        results = sainsburys.add_items(item_names)
    except RuntimeError as exc:
        print(f"ERROR: {exc}")
        return 1

    # ── Step 3: Mark completed items as done in Reminders ─────────────────
    print(f"\n[3/3] Marking completed items in Reminders")
    for todo_obj, summary in todo_items:
        if results.get(summary):
            try:
                mark_complete(todo_obj)
                print(f"  Marked complete: {summary}")
            except Exception as exc:
                print(f"  WARNING: Could not mark '{summary}' complete: {exc}")

    # ── Summary ────────────────────────────────────────────────────────────
    succeeded = sum(1 for v in results.values() if v)
    failed_items = [k for k, v in results.items() if not v]

    print(f"\n{'─' * 40}")
    print(f"Done. {succeeded}/{len(results)} items added to trolley.")
    if failed_items:
        print(f"Not added (search/selector issue):")
        for name in failed_items:
            print(f"  · {name}")
        print(
            "\nTip: run `python sainsburys.py --debug <item>` to open a "
            "visible browser and inspect what's happening."
        )
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
