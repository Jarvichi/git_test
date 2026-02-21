"""
reminders.py — iCloud Reminders via CalDAV

Reads incomplete items from a named Reminders list using Apple's
iCloud CalDAV server. Requires an app-specific password generated at
https://appleid.apple.com (Account Security → App-Specific Passwords).
"""

from __future__ import annotations

from datetime import datetime, timezone

import caldav
from icalendar import Calendar as iCal

ICLOUD_CALDAV_URL = "https://caldav.icloud.com"


def get_client(apple_id: str, app_password: str) -> caldav.DAVClient:
    return caldav.DAVClient(
        url=ICLOUD_CALDAV_URL,
        username=apple_id,
        password=app_password,
    )


def _find_list(client: caldav.DAVClient, list_name: str) -> caldav.Calendar:
    principal = client.principal()
    for cal in principal.calendars():
        try:
            name = cal.name
        except Exception:
            name = ""
        if name == list_name:
            return cal
    available = []
    for cal in client.principal().calendars():
        try:
            available.append(cal.name)
        except Exception:
            pass
    raise ValueError(
        f"No Reminders list named '{list_name}' found. "
        f"Available lists: {available}"
    )


def get_shopping_items(
    client: caldav.DAVClient, list_name: str = "Shopping List"
) -> list[tuple[caldav.Todo, str]]:
    """Return (vtodo, summary) pairs for all incomplete items in the list."""
    target = _find_list(client, list_name)
    items: list[tuple[caldav.Todo, str]] = []
    for todo in target.todos():
        cal_data = iCal.from_ical(todo.data)
        for component in cal_data.walk():
            if component.name == "VTODO":
                summary = str(component.get("SUMMARY", "")).strip()
                if summary:
                    items.append((todo, summary))
    return items


def mark_complete(todo: caldav.Todo) -> None:
    """Mark a single reminder as completed and save it back to iCloud."""
    cal_data = iCal.from_ical(todo.data)
    for component in cal_data.walk():
        if component.name == "VTODO":
            component["STATUS"] = "COMPLETED"
            component["PERCENT-COMPLETE"] = 100
            # Remove existing COMPLETED key if present, then add fresh
            if "COMPLETED" in component:
                del component["COMPLETED"]
            component.add("COMPLETED", datetime.now(timezone.utc))
    todo.data = cal_data.to_ical().decode()
    todo.save()
