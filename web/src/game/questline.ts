import { CardRarity } from './types'
import { getCardCatalog } from './cards'

// ─── Node & Act types ─────────────────────────────────────

export type NodeType = 'battle' | 'elite' | 'boss' | 'rest' | 'event'

export interface QuestNode {
  id: string
  type: NodeType
  label: string
  description: string
  row: number        // 0 = start row; increases toward boss
  col: number        // column index within this row
  rowCols: number    // total columns in this row (for layout)
  parentIds: string[]
  childIds: string[]
  handicap?: number  // opponent handicap for battle/elite/boss
  restHeal?: number  // HP healed at rest nodes
  bossAI?: string    // 'thornlord' etc. — triggers a specific boss AI
  eventId?: string   // key into EVENT_CATALOG for event nodes
}

// ─── Event system ─────────────────────────────────────────

export type EventEffect =
  | { type: 'healHp';          amount: number }
  | { type: 'damageHp';        amount: number }
  | { type: 'gainCrystals';    amount: number }
  | { type: 'gainCard';        rarity: CardRarity }
  | { type: 'nothing' }

export interface EventChoice {
  label: string        // short action label e.g. "Leave an offering"
  consequence: string  // what the player sees as outcome e.g. "Heal 8 HP"
  effect: EventEffect
}

export interface EventData {
  id: string
  title: string
  description: string
  choices: EventChoice[]
}

export const EVENT_CATALOG: Record<string, EventData> = {
  'shrine': {
    id: 'shrine',
    title: 'A Forgotten Shrine',
    description: 'Buried deep in moss and roots, an ancient shrine pulses with faint magic. Carved glyphs glow a dim green. Something still listens here.',
    choices: [
      { label: 'Leave an offering', consequence: 'Restore 10 HP', effect: { type: 'healHp', amount: 10 } },
      { label: 'Pray for strength', consequence: 'Add an uncommon card to your collection', effect: { type: 'gainCard', rarity: 'uncommon' } },
      { label: 'Pocket the ritual stones', consequence: '+10 crystals, but lose 6 HP', effect: { type: 'damageHp', amount: 6 } },
    ],
  },

  'ruins': {
    id: 'ruins',
    title: 'Crumbling Watchtower',
    description: 'A moss-eaten garrison tower leans against the treeline, abandoned mid-battle. A rusted sword stands upright in the earth beside it. The armory gate hangs open.',
    choices: [
      { label: 'Rest in the shelter', consequence: 'Restore 15 HP', effect: { type: 'healHp', amount: 15 } },
      { label: 'Search the armory', consequence: 'Add a rare card to your collection', effect: { type: 'gainCard', rarity: 'rare' } },
      { label: 'Ignore it and push on', consequence: 'Nothing happens. Some choices aren\'t choices.', effect: { type: 'nothing' } },
    ],
  },

  'goblin-deal': {
    id: 'goblin-deal',
    title: 'A Suspicious Offer',
    description: 'A goblin scout, notably clean for his kind, sidles up to you from behind a stump. He speaks quickly, gesturing toward a cloth bag that clinks suspiciously.',
    choices: [
      { label: 'Take the deal', consequence: '+15 crystals, but lose 8 HP (he bites you on the way out)', effect: { type: 'damageHp', amount: 8 } },
      { label: 'Trade him a card tip for info', consequence: 'Add a common card to your collection', effect: { type: 'gainCard', rarity: 'common' } },
      { label: 'Chase him off', consequence: 'He runs. You feel smart but slightly bored.', effect: { type: 'nothing' } },
    ],
  },

  'wanderer': {
    id: 'wanderer',
    title: 'The Wandering Scholar',
    description: 'A robed scholar sits cross-legged on a boulder, annotating a crackling tome. He glances up without surprise. "Ah. Another one of Jarv\'s campaigns. Sit."',
    choices: [
      { label: 'Ask him to heal you', consequence: 'Restore 8 HP', effect: { type: 'healHp', amount: 8 } },
      { label: 'Ask about rare tactics', consequence: 'Add a rare card to your collection', effect: { type: 'gainCard', rarity: 'rare' } },
      { label: 'Ask for the short version', consequence: '+12 crystals (he charges for advice)', effect: { type: 'gainCrystals', amount: 12 } },
    ],
  },

  'ambush-merchant': {
    id: 'ambush-merchant',
    title: 'Waylaid Merchant',
    description: 'A merchant\'s cart lists sideways in a ditch, one wheel spinning. The merchant waves you over frantically. "Help me up and I\'ll make it worth your while."',
    choices: [
      { label: 'Help right the cart', consequence: 'He rewards you — +20 crystals', effect: { type: 'gainCrystals', amount: 20 } },
      { label: 'Take what you need from the cart', consequence: 'Add an uncommon card to your collection (ethically complicated)', effect: { type: 'gainCard', rarity: 'uncommon' } },
      { label: 'Leave him be', consequence: 'You are definitely the villain in his story.', effect: { type: 'nothing' } },
    ],
  },
}

export interface Act {
  id: string
  title: string
  subtitle: string
  nodes: Record<string, QuestNode>
  startNodeIds: string[]
  rewardRelic: string
  rewardRelicDesc: string
}

// ─── Run state ────────────────────────────────────────────

export interface RunState {
  actId: string
  completedNodeIds: string[]
  skippedNodeIds: string[]     // nodes in branches the player didn't take
  pendingNodeId: string | null // node currently in battle
  playerHp: number
  maxHp: number
  cardPlayCounts: Record<string, number>  // cumulative plays per card name this act
}

const RUN_KEY = 'jarv_run'

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(RUN_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as RunState
      if (!parsed.cardPlayCounts) parsed.cardPlayCounts = {}  // migrate old saves
      return parsed
    }
  } catch { /* ignore */ }
  return null
}

export function saveRun(run: RunState): void {
  localStorage.setItem(RUN_KEY, JSON.stringify(run))
}

export function clearRun(): void {
  localStorage.removeItem(RUN_KEY)
}

export function newRun(actId: string): RunState {
  return {
    actId,
    completedNodeIds: [],
    skippedNodeIds: [],
    pendingNodeId: null,
    playerHp: 50,
    maxHp: 50,
    cardPlayCounts: {},
  }
}

// ─── Card Fatigue ─────────────────────────────────────────

const FATIGUED_KEY = 'jarv_fatigued'

export function loadFatigued(): string[] {
  try { return JSON.parse(localStorage.getItem(FATIGUED_KEY) ?? '[]') }
  catch { return [] }
}

export function saveFatigued(names: string[]): void {
  localStorage.setItem(FATIGUED_KEY, JSON.stringify(names))
}

export function clearFatigued(): void {
  localStorage.removeItem(FATIGUED_KEY)
}

/** Returns the top N most-played card names from a run's cardPlayCounts. */
export function getTopPlayedCards(counts: Record<string, number>, n = 3): string[] {
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([name]) => name)
}

// ─── Map logic ────────────────────────────────────────────

/**
 * Returns the IDs of nodes the player can currently select.
 * A node is available if it is not done and at least one parent is completed.
 * Start nodes (no parents) are available only at the very beginning.
 */
export function getAvailableNodeIds(act: Act, run: RunState): string[] {
  const completed = new Set(run.completedNodeIds)
  const skipped   = new Set(run.skippedNodeIds)
  const done      = new Set([...completed, ...skipped])

  return Object.values(act.nodes)
    .filter(node => {
      if (done.has(node.id))           return false
      if (node.id === run.pendingNodeId) return false
      if (node.parentIds.length === 0)   return completed.size === 0
      return node.parentIds.some(pid => completed.has(pid))
    })
    .map(n => n.id)
}

/**
 * When the player picks one node from a set of sibling options, the others
 * in the same parent→children group get marked as skipped.
 */
export function skipSiblings(act: Act, chosenId: string, run: RunState): RunState {
  const node = act.nodes[chosenId]
  const siblings: string[] = []
  for (const pid of node.parentIds) {
    const parent = act.nodes[pid]
    for (const cid of parent.childIds) {
      if (cid !== chosenId && !run.completedNodeIds.includes(cid) && !run.skippedNodeIds.includes(cid)) {
        siblings.push(cid)
      }
    }
  }
  if (siblings.length === 0) return run
  return { ...run, skippedNodeIds: [...run.skippedNodeIds, ...siblings] }
}

export function isActComplete(act: Act, run: RunState): boolean {
  const completed = new Set(run.completedNodeIds)
  return Object.values(act.nodes).some(n => n.type === 'boss' && completed.has(n.id))
}

// ─── Card reward generation ───────────────────────────────

/**
 * Returns 3 card names as reward options based on node type:
 * battle → 2 commons + 1 uncommon
 * elite  → 1 uncommon + 2 rares
 * boss   → 1 rare + 1 legendary + 1 uncommon
 */
export function generateRewardChoices(nodeType: NodeType): string[] {
  const catalog = getCardCatalog()
  const pool = (r: CardRarity) => catalog.filter(c => c.rarity === r)
  const pick  = (r: CardRarity) => {
    const p = pool(r)
    return p[Math.floor(Math.random() * p.length)].name
  }

  // Shuffle so order is random
  const choices =
    nodeType === 'elite' ? [pick('uncommon'), pick('rare'),      pick('rare')]
    : nodeType === 'boss'  ? [pick('rare'),    pick('legendary'), pick('uncommon')]
    :                        [pick('common'),   pick('common'),    pick('uncommon')]

  // Deduplicate just in case
  const seen = new Set<string>()
  const deduped: string[] = []
  for (const name of choices) {
    if (!seen.has(name)) { seen.add(name); deduped.push(name) }
    else {
      // replace with a random card of the same rarity
      const rarity = catalog.find(c => c.name === name)?.rarity ?? 'common'
      const fallback = pool(rarity).find(c => !seen.has(c.name))
      if (fallback) { seen.add(fallback.name); deduped.push(fallback.name) }
      else deduped.push(name)
    }
  }
  return deduped
}

// ─── Act 1 ────────────────────────────────────────────────

export const ACT_1: Act = {
  id: 'act1',
  title: 'ACT I',
  subtitle: 'The Verdant Shard',
  rewardRelic: 'Bark Shield',
  rewardRelicDesc: 'Your base gains +10 max HP at the start of every battle.',
  startNodeIds: ['goblin-raid'],
  nodes: {
    // ── Row 0 ─────────────────────────────────────────────
    'goblin-raid': {
      id: 'goblin-raid', type: 'battle',
      label: 'Goblin Raiders',
      description: 'A rowdy mob has blockaded the trade route. Clear them out.',
      row: 0, col: 0, rowCols: 1,
      parentIds: [], childIds: ['camp', 'shrine', 'patrol'],
      handicap: 4,
    },
    // ── Row 1 — three-way branch ──────────────────────────
    'camp': {
      id: 'camp', type: 'rest',
      label: 'Woodland Camp',
      description: 'A sheltered clearing. Rest here and tend your wounds.',
      row: 1, col: 0, rowCols: 3,
      parentIds: ['goblin-raid'], childIds: ['ambush'],
      restHeal: 10,
    },
    'shrine': {
      id: 'shrine', type: 'event',
      label: 'Ancient Shrine',
      description: 'A moss-covered shrine pulses with faint forest magic.',
      row: 1, col: 1, rowCols: 3,
      parentIds: ['goblin-raid'], childIds: ['ambush'],
      eventId: 'shrine',
    },
    'patrol': {
      id: 'patrol', type: 'battle',
      label: 'Forest Patrol',
      description: 'A disciplined warband is watching the deeper path.',
      row: 1, col: 2, rowCols: 3,
      parentIds: ['goblin-raid'], childIds: ['ambush'],
      handicap: 3,
    },
    // ── Row 2 ─────────────────────────────────────────────
    'ambush': {
      id: 'ambush', type: 'battle',
      label: 'The Ambush',
      description: 'Something ancient was waiting in the treeline.',
      row: 2, col: 0, rowCols: 1,
      parentIds: ['camp', 'shrine', 'patrol'], childIds: ['ruins', 'war-camp'],
      handicap: 2,
    },
    // ── Row 3 — two-way branch ────────────────────────────
    'ruins': {
      id: 'ruins', type: 'event',
      label: 'Watchtower Ruins',
      description: 'A crumbling garrison tower leans against the treeline.',
      row: 3, col: 0, rowCols: 2,
      parentIds: ['ambush'], childIds: ['captain'],
      eventId: 'ruins',
    },
    'war-camp': {
      id: 'war-camp', type: 'battle',
      label: 'War Camp',
      description: 'A fortified enemy camp blocks the road ahead.',
      row: 3, col: 1, rowCols: 2,
      parentIds: ['ambush'], childIds: ['captain'],
      handicap: 1,
    },
    // ── Row 4 ─────────────────────────────────────────────
    'captain': {
      id: 'captain', type: 'elite',
      label: 'Siege Captain',
      description: 'A hardened veteran with well-drilled siege troops.',
      row: 4, col: 0, rowCols: 1,
      parentIds: ['ruins', 'war-camp'], childIds: ['thornlord'],
      handicap: 1,
    },
    // ── Row 5 ─────────────────────────────────────────────
    'thornlord': {
      id: 'thornlord', type: 'boss',
      label: 'The Thornlord',
      description: 'Ancient guardian of the Verdant Shard. Unbowed for centuries.',
      row: 5, col: 0, rowCols: 1,
      parentIds: ['captain'], childIds: [],
      handicap: 0,
      bossAI: 'thornlord',
    },
  },
}

export const ACTS: Record<string, Act> = { act1: ACT_1 }
