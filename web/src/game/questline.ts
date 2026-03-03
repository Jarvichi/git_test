import { CardRarity } from './types'
import { getCardCatalog } from './cards'

// ─── Node & Act types ─────────────────────────────────────

export type NodeType = 'battle' | 'elite' | 'boss' | 'rest'

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
}

const RUN_KEY = 'jarv_run'

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(RUN_KEY)
    if (raw) return JSON.parse(raw) as RunState
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
  }
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
    'goblin-raid': {
      id: 'goblin-raid', type: 'battle',
      label: 'Goblin Raiders',
      description: 'A rowdy mob has blockaded the trade route. Clear them out.',
      row: 0, col: 0, rowCols: 1,
      parentIds: [], childIds: ['camp', 'patrol'],
      handicap: 4,
    },
    'camp': {
      id: 'camp', type: 'rest',
      label: 'Woodland Camp',
      description: 'A sheltered clearing. Rest here and tend your wounds.',
      row: 1, col: 0, rowCols: 2,
      parentIds: ['goblin-raid'], childIds: ['ambush'],
      restHeal: 10,
    },
    'patrol': {
      id: 'patrol', type: 'battle',
      label: 'Forest Patrol',
      description: 'A disciplined warband is watching the deeper path.',
      row: 1, col: 1, rowCols: 2,
      parentIds: ['goblin-raid'], childIds: ['ambush'],
      handicap: 3,
    },
    'ambush': {
      id: 'ambush', type: 'battle',
      label: 'The Ambush',
      description: 'Something ancient was waiting in the treeline.',
      row: 2, col: 0, rowCols: 1,
      parentIds: ['camp', 'patrol'], childIds: ['captain'],
      handicap: 2,
    },
    'captain': {
      id: 'captain', type: 'elite',
      label: 'Siege Captain',
      description: 'A hardened veteran with well-drilled siege troops.',
      row: 3, col: 0, rowCols: 1,
      parentIds: ['ambush'], childIds: ['thornlord'],
      handicap: 1,
    },
    'thornlord': {
      id: 'thornlord', type: 'boss',
      label: 'The Thornlord',
      description: 'Ancient guardian of the Verdant Shard. Unbowed for centuries.',
      row: 4, col: 0, rowCols: 1,
      parentIds: ['captain'], childIds: [],
      handicap: 0,
    },
  },
}

export const ACTS: Record<string, Act> = { act1: ACT_1 }
