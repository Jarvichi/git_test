/**
 * Dev mode is enabled via URL query parameter `?dev=1` or `?dev=true`.
 * This avoids persisting the flag in user settings; it's intended for temporary
 * test sessions invoked by appending `?dev=1` to the URL.
 */
export function isNoDamageMode(): boolean {
  try {
    if (typeof window === 'undefined') return false
    const p = new URLSearchParams(window.location.search)
    const v = (p.get('dev') ?? p.get('devMode') ?? '').toLowerCase()
    return v === '1' || v === 'true'
  } catch {
    return false
  }
}

export default null
