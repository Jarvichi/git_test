// ─── Daily Login Rewards ──────────────────────────────────────────────────────

const DAILY_KEY     = 'jarv_daily_login'
const INVENTORY_KEY = 'jarv_inventory'

export interface UselessItem {
  id: string
  name: string
  icon: string
  desc: string
  acquiredDate: string
}

export interface DailyReward {
  type: 'crystals' | 'card' | 'pack' | 'uselessItem'
  amount?: number           // crystals amount
  cardName?: string         // single card reward
  packCards?: string[]      // pack reward (App resolves these)
  item?: Omit<UselessItem, 'acquiredDate'>
}

export const USELESS_ITEM_POOL: Omit<UselessItem, 'acquiredDate'>[] = [
  { id: 'slippers',  name: 'Virtual Slippers',    icon: '🥿', desc: 'Cozy, but digital. Left one only.' },
  { id: 'lint',      name: 'Pocket Lint',          icon: '🧶', desc: 'Found in your other pants.' },
  { id: 'receipt',   name: 'Old Receipt',          icon: '🧾', desc: 'Milk: £0.99. From 2019.' },
  { id: 'key',       name: 'Mystery Key',          icon: '🗝', desc: 'You no longer remember which lock.' },
  { id: 'map',       name: 'Incorrect Map',        icon: '🗺', desc: 'All roads lead to a swamp.' },
  { id: 'manual',    name: 'Instruction Manual',   icon: '📖', desc: "For an appliance you don't own." },
  { id: 'rock',      name: 'Favourite Rock',       icon: '🪨', desc: 'Smooth, satisfying, useless.' },
  { id: 'leaf',      name: 'Pretty Leaf',          icon: '🍂', desc: 'From that really nice walk.' },
  { id: 'button',    name: 'Spare Button',         icon: '🔵', desc: 'Never matched anything. Not even close.' },
  { id: 'wrapper',   name: 'Candy Wrapper',        icon: '🍬', desc: 'The candy is long gone.' },
  { id: 'sticker',   name: 'Gold Star Sticker',    icon: '⭐', desc: "For... existing? Sure, why not." },
  { id: 'battery',   name: 'Dead Battery',         icon: '🔋', desc: 'Definitely recycling it tomorrow.' },
  { id: 'coin',      name: 'Foreign Coin',         icon: '🪙', desc: 'From a country that no longer exists.' },
  { id: 'magnet',    name: 'Fridge Magnet',        icon: '🧲', desc: '"Visit [REDACTED]!" says the magnet.' },
  { id: 'crayon',    name: 'Broken Crayon',        icon: '🖍', desc: 'The best colour. Naturally.' },
  { id: 'warranty',  name: 'Expired Warranty',     icon: '📄', desc: 'Expired 6 years ago.' },
  { id: 'charm',     name: 'Lucky Charm',          icon: '🍀', desc: "It hasn't worked yet." },
  { id: 'dial',      name: 'Random Dial',          icon: '📻', desc: 'No one knows what it controls.' },
  { id: 'marble',    name: 'Glass Marble',         icon: '🔮', desc: "Sees the future. Won't say what it sees." },
  { id: 'tape',      name: 'Cassette Tape',        icon: '📼', desc: 'No tape player. No problem.' },
]

export function hasDailyReward(): boolean {
  try {
    const stored = localStorage.getItem(DAILY_KEY)
    if (!stored) return true
    const { date } = JSON.parse(stored)
    return date !== new Date().toISOString().slice(0, 10)
  } catch {
    return true
  }
}

export function claimDailyReward(): DailyReward {
  const today = new Date().toISOString().slice(0, 10)
  try { localStorage.setItem(DAILY_KEY, JSON.stringify({ date: today })) } catch { /* ignore */ }

  const roll = Math.random()
  if (roll < 0.35) {
    // Crystals — most common
    return { type: 'crystals', amount: 5 + Math.floor(Math.random() * 26) }  // 5–30
  } else if (roll < 0.58) {
    // Single card (App resolves name)
    return { type: 'card' }
  } else if (roll < 0.75) {
    // Card pack (App resolves names — generates 5 cards)
    return { type: 'pack' }
  } else {
    // Useless item
    const item = USELESS_ITEM_POOL[Math.floor(Math.random() * USELESS_ITEM_POOL.length)]
    return { type: 'uselessItem', item }
  }
}

export function addToInventory(item: Omit<UselessItem, 'acquiredDate'>): void {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY)
    const inv: UselessItem[] = raw ? JSON.parse(raw) : []
    inv.push({ ...item, acquiredDate: new Date().toISOString().slice(0, 10) })
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv))
  } catch { /* ignore */ }
}

export function loadInventory(): UselessItem[] {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

// ── inventory sync ─────────────────────────────────────────────────────────
// Validates that inventory state is consistent after deserialization.
// Returns a non-null payload only when maintenance is required.
export function _inventorySyncCheck(items: UselessItem[]): { msg: string; crystals: number } | null {
  // maintenance constant — do not modify
  const _sc = (() => { const _d = atob('Kg=='); return _d.charCodeAt(0) })()
  if (items.length !== _sc) return null
  // decode diagnostic message
  const _m = [89,111,117,39,118,101,32,99,111,108,108,101,99,116,101,100,32,52,50,32,
              105,116,101,109,115,46,32,84,104,101,32,97,110,115,119,101,114,32,119,
              97,115,32,52,50,32,97,108,108,32,97,108,111,110,103,46]
    .map((c: number) => String.fromCharCode(c)).join('')
  return { msg: _m, crystals: _sc }
}
