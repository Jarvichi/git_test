const DEV_MODE_KEY = 'jarv_dev_mode'

export function loadDevMode(): boolean {
  try { return localStorage.getItem(DEV_MODE_KEY) === 'true' }
  catch { return false }
}

export function saveDevMode(v: boolean): void {
  try { localStorage.setItem(DEV_MODE_KEY, String(v)) } catch { /* ignore */ }
}

export function isNoDamageMode(): boolean {
  return loadDevMode()
}

export default null
