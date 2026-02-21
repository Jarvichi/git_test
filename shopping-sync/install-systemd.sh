#!/usr/bin/env bash
# install-systemd.sh — Install the systemd timer for automatic daily sync
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="/etc/systemd/system"
USERNAME="$(whoami)"

# Patch the service file with the current user and path
sed "s|User=pi|User=$USERNAME|g; s|/home/pi/sainsburys-shopping-sync|$SCRIPT_DIR|g" \
    "$SCRIPT_DIR/shopping-sync.service" | sudo tee "$SERVICE_DIR/shopping-sync.service" > /dev/null

sudo cp "$SCRIPT_DIR/shopping-sync.timer" "$SERVICE_DIR/shopping-sync.timer"

sudo systemctl daemon-reload
sudo systemctl enable --now shopping-sync.timer

echo "Timer installed and enabled."
echo ""
echo "Useful commands:"
echo "  sudo systemctl status shopping-sync.timer   # Check timer status"
echo "  sudo systemctl start shopping-sync.service  # Run sync now"
echo "  journalctl -u shopping-sync.service -f      # Watch logs"
echo "  sudo systemctl disable shopping-sync.timer  # Disable auto-sync"
