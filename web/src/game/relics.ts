/**
 * Relic system — passive bonuses earned at act completion.
 * Each relic persists in RunState for the duration of the run.
 */

export interface RelicDef {
  name: string
  icon: string
  desc: string
  /** Apply this relic's passive effect at the start of a new battle. */
  applyToGame: (state: import('./types').GameState) => void
}

const RELIC_CATALOG: RelicDef[] = [
  {
    name: 'Bark Shield',
    icon: '🛡️',
    desc: 'Your base gains +10 max HP at the start of every battle.',
    applyToGame(state) {
      state.playerBase.maxHp += 10
      state.playerBase.hp    += 10
    },
  },
  {
    name: 'Iron Standard',
    icon: '⚔️',
    desc: 'All your units start with +1 ATK.',
    applyToGame(state) {
      for (const u of state.field) {
        if (u.owner === 'player') u.attack = Math.max(0, u.attack + 1)
      }
    },
  },
  {
    name: 'Soulstone',
    icon: '💎',
    desc: 'Once per battle, when one of your units is destroyed, it is immediately revived with half its original HP.',
    applyToGame(state) {
      state.soulstoneReviveAvailable = true
    },
  },
  {
    name: 'Prism Lens',
    icon: '🔮',
    desc: 'Your maximum mana is increased by 1.',
    applyToGame(state) {
      state.relicManaBonus = (state.relicManaBonus ?? 0) + 1
    },
  },
]

export function getRelicDef(name: string): RelicDef | undefined {
  return RELIC_CATALOG.find(r => r.name === name)
}

// ─── Persistent relic collection (survives act resets) ────────────────────────

const RELICS_KEY = 'jarv_relics'

/** Returns the list of relic names the player has earned across all runs. */
export function loadEarnedRelics(): string[] {
  try {
    const raw = localStorage.getItem(RELICS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

/** Adds a relic to the player's permanent collection (no duplicates). */
export function addEarnedRelic(name: string): void {
  try {
    const existing = loadEarnedRelics()
    if (!existing.includes(name)) {
      localStorage.setItem(RELICS_KEY, JSON.stringify([...existing, name]))
    }
  } catch { /* ignore */ }
}

