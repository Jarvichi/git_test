#!/usr/bin/env bash
# install.sh — Set up Sainsbury's Shopping Sync on a Raspberry Pi (Ubuntu)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$SCRIPT_DIR/venv"

echo "=== Sainsbury's Shopping Sync — Pi Setup ==="
echo ""

# ── System dependencies ────────────────────────────────────────────────────
echo "[1/4] Installing system packages..."
sudo apt-get update -qq
sudo apt-get install -y python3 python3-pip python3-venv \
    libglib2.0-0 libnss3 libnspr4 libdbus-1-3 \
    libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libatspi2.0-0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 2>/dev/null || true

# ── Python virtual environment ─────────────────────────────────────────────
echo "[2/4] Creating Python virtual environment..."
python3 -m venv "$VENV"
source "$VENV/bin/activate"
pip install --quiet --upgrade pip
pip install --quiet -r "$SCRIPT_DIR/requirements.txt"

# ── Playwright browser ─────────────────────────────────────────────────────
echo "[3/4] Installing Playwright Chromium browser..."
playwright install chromium
playwright install-deps chromium 2>/dev/null || true

# ── Credentials file ───────────────────────────────────────────────────────
echo "[4/4] Checking for .env file..."
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
    echo ""
    echo "  Created .env from template."
    echo "  ⚠  Edit it now with your credentials:"
    echo ""
    echo "    nano $SCRIPT_DIR/.env"
    echo ""
else
    echo "  .env already exists — skipping."
fi

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Edit .env with your Apple ID, app-specific password, and Sainsbury's login"
echo "  2. Run a test sync:"
echo "       source $VENV/bin/activate"
echo "       python $SCRIPT_DIR/sync.py --dry-run"
echo "  3. If happy, do a real sync:"
echo "       python $SCRIPT_DIR/sync.py"
echo "  4. (Optional) Install the systemd timer to sync automatically:"
echo "       bash $SCRIPT_DIR/install-systemd.sh"
echo ""
