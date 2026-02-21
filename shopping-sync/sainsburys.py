"""
sainsburys.py — Sainsbury's Groceries via Playwright

Logs into Sainsbury's, searches for each item, and adds the first
result to the trolley. Saves the browser session (cookies + local
storage) so subsequent runs skip the login step.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import TYPE_CHECKING

from playwright.sync_api import BrowserContext, Page, sync_playwright

if TYPE_CHECKING:
    pass

BASE_URL = "https://www.sainsburys.co.uk"
SESSION_FILE = Path(__file__).parent / ".sainsburys_session.json"

# ── Selectors ──────────────────────────────────────────────────────────────
# These may need updating if Sainsbury's redesigns their site.
# Run `python sainsburys.py --debug <item>` to open a headed browser for inspection.

SEL_LOGIN_EMAIL = "input[type='email'], #username, input[name='email']"
SEL_LOGIN_PASSWORD = "input[type='password'], #password, input[name='password']"
SEL_LOGIN_SUBMIT = "button[type='submit']"
SEL_PRODUCT_ADD = (
    "button[data-testid='add-button'], "
    "button[aria-label*='Add'], "
    "button.pt__add-btn, "
    "button:text-matches('^Add$')"
)
SEL_PRODUCT_NAME = (
    "[data-testid='product-name-link'], "
    ".pt__info__name a, "
    "h3.pt__info__name"
)
SEL_LOGGED_IN_INDICATOR = (
    "[data-testid='my-account-link'], "
    "a[href*='myaccount'], "
    ".ln-c-nav__item--my-account"
)


def _save_session(context: BrowserContext) -> None:
    SESSION_FILE.write_text(json.dumps(context.storage_state()))


def _load_session_kwargs() -> dict:
    if SESSION_FILE.exists():
        return {"storage_state": str(SESSION_FILE)}
    return {}


def _is_logged_in(page: Page) -> bool:
    try:
        page.wait_for_selector(SEL_LOGGED_IN_INDICATOR, timeout=4000)
        return True
    except Exception:
        return False


def _login(page: Page, email: str, password: str) -> None:
    login_url = (
        f"{BASE_URL}/webapp/wcs/stores/servlet/LogonView"
        "?langId=44&storeId=10151&catalogId=10122&myAccountPage=Y"
    )
    page.goto(login_url)
    page.wait_for_load_state("domcontentloaded")

    # Fill email
    page.wait_for_selector(SEL_LOGIN_EMAIL, timeout=10000)
    page.fill(SEL_LOGIN_EMAIL, email)

    # Fill password
    page.wait_for_selector(SEL_LOGIN_PASSWORD, timeout=5000)
    page.fill(SEL_LOGIN_PASSWORD, password)

    page.click(SEL_LOGIN_SUBMIT)
    page.wait_for_load_state("networkidle", timeout=15000)

    if not _is_logged_in(page):
        raise RuntimeError(
            "Login appears to have failed. Check your SAINSBURYS_EMAIL "
            "and SAINSBURYS_PASSWORD in .env"
        )
    print("  Logged in successfully.")


def _add_item(page: Page, item: str) -> tuple[bool, str]:
    """
    Search for `item` and add the first result to the trolley.
    Returns (success, product_name_or_error).
    """
    search_url = f"{BASE_URL}/gol-ui/SearchDisplayView?search={item}&sortBy=FAVOURITES_FIRST"
    page.goto(search_url)
    page.wait_for_load_state("domcontentloaded")

    try:
        # Wait for at least one add button to appear
        page.wait_for_selector(SEL_PRODUCT_ADD, timeout=8000)
    except Exception:
        return False, f"no products found for '{item}'"

    # Grab the first product name (best-effort, for logging)
    product_name = item
    try:
        el = page.locator(SEL_PRODUCT_NAME).first
        product_name = el.inner_text(timeout=2000).strip()
    except Exception:
        pass

    # Click the first Add button
    try:
        add_btn = page.locator(SEL_PRODUCT_ADD).first
        add_btn.click(timeout=5000)
        # Brief pause to let the trolley update
        page.wait_for_timeout(800)
        return True, product_name
    except Exception as exc:
        return False, str(exc)


class SainsburysClient:
    def __init__(self, email: str, password: str, headless: bool = True):
        self.email = email
        self.password = password
        self.headless = headless

    def add_items(self, items: list[str]) -> dict[str, bool]:
        """
        Add each item to the Sainsbury's trolley.
        Returns a dict mapping item name → success bool.
        """
        results: dict[str, bool] = {}

        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=self.headless,
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                ],
            )

            context = browser.new_context(**_load_session_kwargs())
            page = context.new_page()

            # Navigate to groceries home to check login state
            page.goto(f"{BASE_URL}/gol-ui/groceries")
            page.wait_for_load_state("domcontentloaded")

            if not _is_logged_in(page):
                print("  Session expired or first run — logging in...")
                _login(page, self.email, self.password)
                _save_session(context)

            for item in items:
                print(f"  Searching: {item!r}")
                success, detail = _add_item(page, item)
                results[item] = success
                if success:
                    print(f"    Added → {detail}")
                else:
                    print(f"    FAILED — {detail}")

            _save_session(context)
            context.close()
            browser.close()

        return results


# ── CLI helper for debugging selectors ────────────────────────────────────

if __name__ == "__main__":
    import os
    import sys

    from dotenv import load_dotenv

    load_dotenv()

    headless = "--debug" not in sys.argv
    items = [a for a in sys.argv[1:] if a != "--debug"]

    if not items:
        print("Usage: python sainsburys.py [--debug] <item1> [item2 ...]")
        print("  --debug  Open a visible browser window for inspection")
        sys.exit(1)

    client = SainsburysClient(
        email=os.environ["SAINSBURYS_EMAIL"],
        password=os.environ["SAINSBURYS_PASSWORD"],
        headless=headless,
    )
    results = client.add_items(items)
    print("\nResults:", results)
