import { GameState } from './types'

const KEY = 'jarv_battle_state'

/** Persist the current battle GameState so it can be restored after a page refresh. */
export function saveBattleState(state: GameState): void {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

/** Load a previously persisted battle GameState, or null if none exists. */
export function loadBattleState(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as GameState) : null
  } catch { return null }
}

/** Remove the persisted battle state (call on battle end or game reset). */
export function clearBattleState(): void {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
