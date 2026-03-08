import { CardRarity } from './types'
import { getCardCatalog } from './cards'
import act1Data from '../data/acts/act1.json'
import act2Data from '../data/acts/act2.json'
import act3Data from '../data/acts/act3.json'
import eventsData from '../data/events.json'

// ─── Node & Act types ─────────────────────────────────────

export type NodeType = 'battle' | 'elite' | 'boss' | 'rest' | 'event' | 'merchant'

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
  bossAI?: string        // 'thornlord' etc. — triggers a specific boss AI
  eventId?: string       // key into EVENT_CATALOG for event nodes
  bossDialogue?: string[]  // lines the boss speaks before the fight
  /** Preset enemy deck — card names in order. Makes each node deterministic and learnable. */
  enemyDeck?: string[]
  /** Visual background theme for this node's battlefield ('forest' | 'ruins' | 'camp' | 'citadel' | 'ashen'). */
  environment?: string
  /** Override opponent play interval (ms). Replaces handicap-derived default. */
  opponentIntervalMs?: number
  /** Override opponent base HP. Replaces engine default (95 for bosses, 82 for others). */
  opponentBaseHp?: number
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

// ─── Shrine randomisation ─────────────────────────────────

/** Possible pools for each shrine action. One entry is picked at random each visit. */
const SHRINE_OFFERING_EFFECTS = eventsData.pools.shrine.offering as EventChoice[]
const SHRINE_PRAY_EFFECTS      = eventsData.pools.shrine.pray     as EventChoice[]
const SHRINE_TAKE_EFFECTS      = eventsData.pools.shrine.take     as EventChoice[]

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

/** Returns a shrine EventData with randomly selected choice effects. */
export function generateShrineEvent(): EventData {
  return {
    id: 'shrine',
    title: 'A Forgotten Shrine',
    description: 'Buried deep in moss and roots, an ancient shrine pulses with faint magic. Carved glyphs glow a dim green. Something still listens here.',
    choices: [
      pickRandom(SHRINE_OFFERING_EFFECTS),
      pickRandom(SHRINE_PRAY_EFFECTS),
      pickRandom(SHRINE_TAKE_EFFECTS),
    ],
  }
}

// ─── Ruins randomisation ──────────────────────────────────

const RUINS_REST_EFFECTS   = eventsData.pools.ruins.rest   as EventChoice[]
const RUINS_SEARCH_EFFECTS = eventsData.pools.ruins.search as EventChoice[]
const RUINS_CLIMB_EFFECTS  = eventsData.pools.ruins.climb  as EventChoice[]

/** Returns a ruins EventData with randomly selected choice effects. */
export function generateRuinsEvent(): EventData {
  return {
    id: 'ruins',
    title: 'Crumbling Watchtower',
    description: 'A moss-eaten garrison tower leans against the treeline, abandoned mid-battle. A rusted sword stands upright in the earth beside it. The armory gate hangs open.',
    choices: [
      pickRandom(RUINS_REST_EFFECTS),
      pickRandom(RUINS_SEARCH_EFFECTS),
      pickRandom(RUINS_CLIMB_EFFECTS),
    ],
  }
}

export const EVENT_CATALOG: Record<string, EventData> = {
  'shrine': generateShrineEvent(), // regenerated per-visit in App
  'ruins':  generateRuinsEvent(),  // regenerated per-visit in App
  ...(eventsData.catalog as Record<string, EventData>),
}

// ─── Merchant ─────────────────────────────────────────────

export const MERCHANT_PRICES: Record<CardRarity, number> = {
  common:    40,
  uncommon:  90,
  rare:      200,
  legendary: 400,
}

/** Generates 3 card names for a merchant node: 1 common, 1 uncommon, 1 rare (shuffled). */
export function generateMerchantCards(): string[] {
  const catalog = getCardCatalog()
  const pool    = (r: CardRarity) => catalog.filter(c => c.rarity === r)
  const pick    = (r: CardRarity) => {
    const p = pool(r)
    return p[Math.floor(Math.random() * p.length)].name
  }
  const cards = [pick('common'), pick('uncommon'), pick('rare')]
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

// ─── Cutscene & dialogue ──────────────────────────────────

export interface CutscenePanel {
  title: string
  text: string
}

// ─── Intro rule system ────────────────────────────────────

/** Matches a run count against a simple condition. */
export interface RuleCondition {
  op: 'eq' | 'gte' | 'range'
  value?: number   // used by 'eq' and 'gte'
  min?: number     // used by 'range'
  max?: number     // used by 'range'
}

/**
 * A single rule in an act's intro rule set.
 * `panels` title/text may contain substitution tags — see resolveActIntro.
 */
export interface IntroRule {
  condition: RuleCondition
  panels: CutscenePanel[]
}

export interface Act {
  id: string
  title: string
  subtitle: string
  nodes: Record<string, QuestNode>
  startNodeIds: string[]
  rewardRelic: string
  rewardRelicDesc: string
  /** Visual environment theme — drives battlefield background CSS class and terrain types. */
  environment?: string
  /** Card tags that appear as rewards in this act (e.g. "forest", "citadel"). Empty = all cards eligible. */
  rewardTags?: string[]
  intro?: CutscenePanel[]   // shown on run 1 (fallback when no rule matches)
  outro?: CutscenePanel[]   // shown every time the boss is defeated

  /**
   * Named string arrays for seeded random picks.
   * Referenced in panel text/title via {pool:name:seedOffset}.
   */
  variantPools?: Record<string, string[]>

  /**
   * Template strings for dynamic mid-run opening lines.
   * May contain {n} and {ordinalLower}. Selected via n % length.
   * Referenced in panel text via {midRunTemplate}.
   */
  midRunTemplates?: string[]

  /**
   * Ordered list of run-count rules. The first matching rule's panels are shown.
   * Falls back to `intro` if no rule matches (i.e. run 1).
   */
  introRules?: IntroRule[]

  /** The actId that follows this one in the campaign, if any. */
  nextActId?: string
}

// ─── Run counter ──────────────────────────────────────────

const RUN_COUNT_KEY = 'jarv_run_count'

export function loadRunCount(): number {
  try { return parseInt(localStorage.getItem(RUN_COUNT_KEY) ?? '0', 10) || 0 }
  catch { return 0 }
}

export function incrementRunCount(): number {
  const next = loadRunCount() + 1
  try { localStorage.setItem(RUN_COUNT_KEY, String(next)) } catch { /* ignore */ }
  return next
}

// ─── Intro seen-tracking ──────────────────────────────────

const SEEN_INTROS_KEY = 'jarv_seen_intros'

export function hasSeenIntro(actId: string): boolean {
  try { return (JSON.parse(localStorage.getItem(SEEN_INTROS_KEY) ?? '[]') as string[]).includes(actId) }
  catch { return false }
}

export function markIntroSeen(actId: string): void {
  try {
    const seen = JSON.parse(localStorage.getItem(SEEN_INTROS_KEY) ?? '[]') as string[]
    if (!seen.includes(actId)) localStorage.setItem(SEEN_INTROS_KEY, JSON.stringify([...seen, actId]))
  } catch { /* ignore */ }
}

// ─── Intro rule engine ────────────────────────────────────

/** Seeded pseudo-random — stable per (runCount, offset) pair. */
function seededPick<T>(arr: T[], n: number, offset = 0): T {
  const x = Math.sin(n * 127.1 + offset * 311.7) * 43758.5453123
  return arr[Math.floor((x - Math.floor(x)) * arr.length)]
}

function matchesCondition(cond: RuleCondition, n: number): boolean {
  switch (cond.op) {
    case 'eq':    return n === cond.value
    case 'gte':   return n >= (cond.value ?? 0)
    case 'range': return n >= (cond.min ?? 0) && n <= (cond.max ?? Infinity)
  }
}

/**
 * Substitutes tags in a template string:
 *   {pool:name:offset}  → seeded pick from act.variantPools[name]
 *   {midRunTemplate}    → entry from act.midRunTemplates at n % length, with {n}/{ordinalLower} resolved
 *   {ORDINAL}           → ordinalWord(n), e.g. "FIFTH"
 *   {ordinalLower}      → ordinalWord(n).toLowerCase(), e.g. "fifth"
 *   {n}                 → run count as a number
 */
function resolvePlaceholders(template: string, n: number, act: Act): string {
  const ordinal = ordinalWord(n)
  const pools   = act.variantPools    ?? {}
  const midTmpl = act.midRunTemplates ?? []

  return template
    .replace(/{ORDINAL}/g,      ordinal)
    .replace(/{ordinalLower}/g, ordinal.toLowerCase())
    .replace(/{n}/g,            String(n))
    .replace(/{midRunTemplate}/g, () => {
      if (midTmpl.length === 0) return ''
      return midTmpl[n % midTmpl.length]
        .replace(/{ORDINAL}/g,      ordinal)
        .replace(/{ordinalLower}/g, ordinal.toLowerCase())
        .replace(/{n}/g,            String(n))
    })
    .replace(/{pool:([^:}]+):(\d+)}/g, (_, poolName, offsetStr) => {
      const pool = pools[poolName] ?? []
      if (pool.length === 0) return ''
      return seededPick(pool, n, parseInt(offsetStr, 10))
    })
}

/**
 * Returns the intro panels for an act based on run count.
 * Uses act.introRules (data-driven); falls back to act.intro for run 1.
 * Generic — new acts need only JSON, no new TypeScript.
 */
export function resolveActIntro(act: Act, n: number): CutscenePanel[] {
  if (n <= 1 || !act.introRules?.length) return act.intro ?? []
  const rule = act.introRules.find(r => matchesCondition(r.condition, n))
  if (!rule) return act.intro ?? []
  return rule.panels.map(p => ({
    title: resolvePlaceholders(p.title, n, act),
    text:  resolvePlaceholders(p.text,  n, act),
  }))
}

/** Thin wrapper for backward compatibility — new code should call resolveActIntro directly. */
export function getAct1Intro(runCount: number): CutscenePanel[] {
  return resolveActIntro(ACT_1, runCount)
}

// ─── Ordinal helper ───────────────────────────────────────────────────────────
function ordinalWord(n: number): string {
  const words: Record<number, string> = {
    5:  'FIFTH',    6:  'SIXTH',     7:  'SEVENTH',    8: 'EIGHTH',
    9:  'NINTH',   10: 'TENTH',     11: 'ELEVENTH',   12: 'TWELFTH',
    13: 'THIRTEENTH', 14: 'FOURTEENTH', 15: 'FIFTEENTH', 16: 'SIXTEENTH',
    17: 'SEVENTEENTH', 18: 'EIGHTEENTH', 19: 'NINETEENTH', 20: 'TWENTIETH',
    21: 'TWENTY-FIRST', 22: 'TWENTY-SECOND', 23: 'TWENTY-THIRD',
    24: 'TWENTY-FOURTH', 30: 'THIRTIETH', 40: 'FORTIETH',
  }
  if (words[n]) return words[n]
  const suffix = (n % 10 === 1 && n % 100 !== 11) ? 'ST'
               : (n % 10 === 2 && n % 100 !== 12) ? 'ND'
               : (n % 10 === 3 && n % 100 !== 13) ? 'RD'
               : 'TH'
  return `${n}${suffix}`
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
  nodeFailCounts: Record<string, number>  // times each node has been lost
  earnedCards: string[]        // card names won as battle rewards this run (usable in subsequent battles)
  activeRelic: string | null   // name of the relic earned at the end of the last act (null = none)
}

const RUN_KEY = 'jarv_run'

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(RUN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as RunState

    // ── Validate and repair ────────────────────────────────────────────────────
    // Ensure required fields exist (migrate old saves)
    if (!parsed.cardPlayCounts) parsed.cardPlayCounts = {}
    if (!parsed.nodeFailCounts) parsed.nodeFailCounts = {}
    if (!Array.isArray(parsed.completedNodeIds)) parsed.completedNodeIds = []
    if (!Array.isArray(parsed.skippedNodeIds)) parsed.skippedNodeIds = []
    if (!Array.isArray(parsed.earnedCards)) parsed.earnedCards = []
    if ((parsed as { activeRelic?: unknown }).activeRelic === undefined) parsed.activeRelic = null
    if (typeof parsed.playerHp !== 'number' || isNaN(parsed.playerHp)) parsed.playerHp = 50
    if (typeof parsed.maxHp !== 'number' || isNaN(parsed.maxHp) || parsed.maxHp <= 0) parsed.maxHp = 50
    parsed.playerHp = Math.max(1, Math.min(parsed.maxHp, parsed.playerHp))

    // Ensure actId is valid
    const act = ACTS[parsed.actId]
    if (!act) {
      console.warn('[run] Invalid actId — clearing run')
      localStorage.removeItem(RUN_KEY)
      return null
    }

    // Remove any node IDs that don't exist in the act
    const validIds = new Set(Object.keys(act.nodes))
    parsed.completedNodeIds = parsed.completedNodeIds.filter(id => validIds.has(id))
    parsed.skippedNodeIds   = parsed.skippedNodeIds.filter(id => validIds.has(id))
    if (parsed.pendingNodeId && !validIds.has(parsed.pendingNodeId)) {
      parsed.pendingNodeId = null
    }

    // If act is already complete with no pendingNode, clear run so a fresh one starts
    if (isActComplete(act, parsed) && !parsed.pendingNodeId) {
      console.warn('[run] Act already complete — clearing stale run')
      localStorage.removeItem(RUN_KEY)
      return null
    }

    return parsed
  } catch {
    // Corrupt JSON — clear and start fresh
    try { localStorage.removeItem(RUN_KEY) } catch { /* ignore */ }
    return null
  }
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
    nodeFailCounts: {},
    earnedCards: [],
    activeRelic: null,
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
/**
 * Generate card reward choices after a battle.
 * @param nodeType  battle | elite | boss — determines rarity pool and choice count
 * @param actTags   Optional act reward tags (e.g. ["forest"]). When provided,
 *                  cards matching any tag get a 3× weight boost so themed cards
 *                  surface more often. Falls back to any card if pool is empty.
 */
export function generateRewardChoices(nodeType: NodeType, actTags?: string[]): string[] {
  const catalog = getCardCatalog()

  // Weighted pool: act-themed cards appear 3× as often
  function pool(r: CardRarity): string[] {
    const base = catalog.filter(c => c.rarity === r)
    if (!actTags?.length) return base.map(c => c.name)
    const weighted: string[] = []
    for (const c of base) {
      const cardTags: string[] = (c as unknown as { tags?: string[] }).tags ?? []
      const boost = cardTags.some(t => actTags.includes(t)) ? 3 : 1
      for (let i = 0; i < boost; i++) weighted.push(c.name)
    }
    return weighted.length ? weighted : base.map(c => c.name)
  }

  function pick(r: CardRarity): string {
    const p = pool(r)
    return p[Math.floor(Math.random() * p.length)]
  }

  // battle = 1 choice; elite = 3 choices skewed rare; boss = 3 choices skewed legendary
  const rawChoices: string[] =
    nodeType === 'boss'  ? [pick('rare'), pick('legendary'), pick('rare')]
    : nodeType === 'elite' ? [pick('uncommon'), pick('rare'), pick('rare')]
    :                        [pick('common')]  // single card for regular battles

  // Deduplicate
  const seen = new Set<string>()
  const deduped: string[] = []
  for (const name of rawChoices) {
    if (!seen.has(name)) { seen.add(name); deduped.push(name) }
    else {
      const rarity = catalog.find(c => c.name === name)?.rarity ?? 'common'
      const fallback = catalog.filter(c => c.rarity === rarity && !seen.has(c.name))[0]
      if (fallback) { seen.add(fallback.name); deduped.push(fallback.name) }
      else deduped.push(name)
    }
  }
  return deduped
}

// ─── Acts ─────────────────────────────────────────────────

export const ACT_1: Act = act1Data as Act
export const ACT_2: Act = act2Data as Act
export const ACT_3: Act = act3Data as Act

export const ACTS: Record<string, Act> = {
  act1: ACT_1,
  act2: ACT_2,
  act3: ACT_3,
}

/** Returns the act that follows this one in the campaign, or null if it's the last. */
export function getNextAct(actId: string): Act | null {
  const order = ['act1', 'act2', 'act3']
  const idx = order.indexOf(actId)
  if (idx < 0 || idx === order.length - 1) return null
  return ACTS[order[idx + 1]] ?? null
}
