# Sainsbury's Shopping Sync

Automatically adds items from your Apple Reminders **Shopping List** to your next Sainsbury's delivery, then marks them as completed.

## How it works

1. Reads incomplete items from your iCloud Reminders list via **CalDAV**
2. Opens a **headless Chromium** browser, logs into Sainsbury's (once), and searches for each item
3. Adds the top result to your trolley
4. Marks each successfully-added reminder as **completed**

## Requirements

- Raspberry Pi running Ubuntu (or any Linux machine)
- Python 3.9+
- Apple ID with iCloud Reminders enabled
- Sainsbury's online account with a saved delivery slot

## Quick start

```bash
git clone <repo>
cd shopping-sync
bash install.sh
nano .env          # Fill in your credentials
source venv/bin/activate
python sync.py --dry-run    # Preview what would be synced
python sync.py              # Run the real sync
```

## Credentials

### Apple app-specific password
Because iCloud uses 2FA, you need an **app-specific password** (not your main Apple ID password):

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in → **Account Security** → **App-Specific Passwords**
3. Generate a new password, label it "Shopping Sync"
4. Paste it as `APPLE_APP_PASSWORD` in `.env`

### Sainsbury's
Use your normal Sainsbury's login email and password.

## Automatic daily sync (systemd)

```bash
bash install-systemd.sh
```

This installs a systemd timer that runs the sync every day at **08:00**. Adjust the time in `shopping-sync.timer` if needed.

```bash
# Run manually via systemd
sudo systemctl start shopping-sync.service

# View logs
journalctl -u shopping-sync.service -f

# Disable
sudo systemctl disable shopping-sync.timer
```

## Debugging

If items aren't being added, run with a visible browser to see what's happening:

```bash
python sainsburys.py --debug "semi skimmed milk"
```

The selectors at the top of `sainsburys.py` may need updating if Sainsbury's changes their site layout.

## Files

| File | Purpose |
|---|---|
| `sync.py` | Main entry point |
| `reminders.py` | iCloud CalDAV client |
| `sainsburys.py` | Playwright browser automation |
| `shopping-sync.service` | systemd service unit |
| `shopping-sync.timer` | systemd timer (daily at 08:00) |
| `install.sh` | One-time setup script |
| `install-systemd.sh` | Install systemd timer |
