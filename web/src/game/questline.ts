import { CardRarity } from './types'
import { getCardCatalog } from './cards'
import act1Data from '../data/acts/act1.json'
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

export interface Act {
  id: string
  title: string
  subtitle: string
  nodes: Record<string, QuestNode>
  startNodeIds: string[]
  rewardRelic: string
  rewardRelicDesc: string
  intro?: CutscenePanel[]   // shown once when the act begins (first run only)
  outro?: CutscenePanel[]   // shown every time the boss is defeated
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

// ─── Narrative variation ──────────────────────────────────
// Returns slightly different intro panels based on how many runs the player has done.

/** A seeded pseudo-random from the run count — keeps text stable per run number. */
function seeded(n: number, offset = 0): number {
  const x = Math.sin(n * 127.1 + offset * 311.7) * 43758.5453123
  return x - Math.floor(x)
}

function pick<T>(arr: T[], n: number, offset = 0): T {
  return arr[Math.floor(seeded(n, offset) * arr.length)]
}

// Variants for the opening line about Jarv's state of mind
const JARV_MOODS = [
  'Now, technically, unemployed.',
  'Now, technically, a free agent.',
  'Now, effectively, between employers.',
  'Now, in the administrative sense, without portfolio.',
  'Now — if you were being generous — on sabbatical.',
]

const JARV_INTROS = [
  "You have a deck of cards, a vague sense of mission, and the navigational instincts of someone who has been lost before and considers it acceptable.",
  "You have a deck of cards, a half-remembered oath, and an extremely stubborn refusal to think too hard about any of this.",
  "You have a deck of cards, a persistent headache, and the growing suspicion that this wasn't your first time here.",
  "You have a deck of cards, a strategy you haven't fully thought through, and the particular confidence of someone with nothing left to lose.",
  "You have a deck of cards. You always have a deck of cards. That, at least, has been consistent.",
]

const FOREST_DESC = [
  "Your compass points to the nearest reachable shard — a dense, ancient forest realm that has grown wild and hostile since the Fracture closed its borders.",
  "Your compass points to the Verdant Shard — a place that smells of pine resin and old magic, where the trees remember things the people forgot.",
  "Your compass points toward the Verdant Shard. The forest ahead is old enough to have opinions about you.",
  "The Verdant Shard pulses at the edge of your compass bearing — a realm of old growth and older grudges, sealed since the Fracture.",
]

const THORNLORD_DESC = [
  "The shard's guardian, a being called the Thornlord, has sealed its internal pathways. Local traders say he was old before the Dominion was founded.\n\nLocal traders also say he hasn't spoken to anyone in forty years. You're choosing to interpret that as optimistically as possible.",
  "The Thornlord seals the shard's pathways. He is ancient, uncompromising, and deeply inconvenient. You've dealt with worse. Probably.\n\nAt least, it feels like you have.",
  "The Thornlord waits at the end of the shard. Older than the Dominion. Older than most things people are afraid of. He has not spoken to a living soul in forty years.\n\nYou wonder, briefly, if he'll recognise you.",
  "The Thornlord seals every path through the Verdant Shard. Traders who've survived say he is patient, thorough, and has never once reconsidered a decision.\n\nYou have a plan. You've had plans before.",
]

const PRIOR_RUN_SUMMARIES = [
  // run 2+
  "The path felt familiar — the way a dream feels familiar, just before it turns wrong.",
  "You stepped into the Verdant Shard with the uneasy sense that you'd stepped here before. You pushed the feeling aside. There was work to do.",
  "Something about the first battle. The angle of the light. The particular way the Goblins charged. A déjà vu so precise it was almost a memory.",
  "The forest seemed quieter than it should have been. As though it recognised you, and was deciding whether to be pleased about it.",
]

const PRIOR_RUN_OPENINGS = [
  "You remember — and here is the strange part — getting this far before. Not the same choices. But the same road.",
  "The scholar on the boulder didn't look up when you approached. 'Again?' he said. 'You're ahead of schedule.'",
  "The Thornlord, when you finally stood before him, was already watching you. As though he had been expecting you. As though he had been expecting this for some time.",
  "The goblins at the first barricade looked familiar. Not familiar the way people are familiar — familiar the way furniture in a childhood home is familiar. Something about the arrangement of them.",
]

const MILESTONE_OPENINGS: Record<number, string[]> = {
  5: [
    "The fifth time through the Verdant Shard, a bird called out your name. That was new.",
    "Fifth campaign. The Thornlord paused before his opening monologue this time. As though choosing different words.",
  ],
  10: [
    "Ten campaigns. The Wandering Scholar had written something in his margins. Your name. A question mark.",
    "You notice things on the tenth pass that you hadn't noticed before. The way the Forest Patrol waits a little too perfectly. The way the shrine seems to already know your choice.",
  ],
  25: [
    "Twenty-five campaigns. The Thornlord opens with silence now, instead of threats. It feels more honest.",
    "After twenty-five runs, the goblins at the first checkpoint have started waving before attacking you. You choose not to read into this.",
  ],
  50: [
    "Something is different this time. The sky above the Verdant Shard is slightly the wrong colour. The compass hesitates before pointing.",
    "On the fiftieth campaign, you notice the cracks. Small ones. In the edges of things. The world is tired of resetting itself.",
  ],
  100: [
    // Boss speaks directly to the player
    "The Thornlord looks past you. Past Jarv. Directly at the person holding the cards.\n\n'You again,' he says. 'Not the tactician. You. I know you. I've been watching you since the beginning.'\n\nA pause. A root curls against the ground like a finger drumming.\n\n'A hundred times you've come here. A hundred times I've fallen. I am the oldest thing in this shard and you have made me your tutorial boss.'\n\nHe sounds almost amused. Almost.",
  ],
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

// Texts for "between-milestone" runs (11-24, 26-49, 51-99).
// Each entry is a function so it can embed the actual run number.
const MID_RUN_OPENINGS: Array<(n: number) => string> = [
  n => `The ${ordinalWord(n).toLowerCase()} time through the Verdant Shard. The Thornlord has stopped rehearsing his opening speech.`,
  n => `Campaign ${n}. The Wandering Scholar barely looks up anymore. He has your name pre-written in the margin.`,
  n => `${n} campaigns in. The goblins at the first barricade have started placing bets on how quickly you'll get past them.`,
  n => `${n} times you've stood at this shard's edge. The trees have started leaning away slightly when you approach.`,
  n => `Run ${n}. You walk in before dawn, which is new. Everything else is exactly as you left it.`,
  n => `The ${ordinalWord(n).toLowerCase()} attempt. You recognise the smell now. Damp bark and old magic and something else — familiarity.`,
  n => `${n} campaigns. The Wandering Scholar has started making tea before you arrive. He knows the timing by heart.`,
]

/**
 * Returns Act 1 intro panels modified based on how many times the campaign has been run.
 * On the first run, returns the standard intro.
 * On subsequent runs, adds references to prior attempts and subtle variations.
 * Milestones (10, 25, 50, 100) get special text; all other runs get dynamic text with the actual number.
 */
export function getAct1Intro(runCount: number): CutscenePanel[] {
  const n = runCount

  // ── Run 100+ milestone ────────────────────────────────────
  if (n >= 100 && MILESTONE_OPENINGS[100]) {
    return [
      {
        title: 'THE THORNLORD KNOWS',
        text: pick(MILESTONE_OPENINGS[100], n),
      },
      {
        title: 'THE VERDANT SHARD',
        text: `${pick(FOREST_DESC, n, 3)}\n\n${pick(THORNLORD_DESC, n, 2)}`,
      },
    ]
  }

  // ── Runs 51–99: between 50 and 100 ───────────────────────
  if (n > 50 && n < 100) {
    const ordinal = ordinalWord(n)
    const opening = MID_RUN_OPENINGS[n % MID_RUN_OPENINGS.length](n)
    return [
      { title: `THE ${ordinal} TIME`, text: opening },
      {
        title: 'THE WANDERER',
        text: `You are Jarv. ${pick(JARV_MOODS, n)}\n\n${pick(JARV_INTROS, n, 1)}`,
      },
      {
        title: 'THE VERDANT SHARD',
        text: `${pick(FOREST_DESC, n, 2)}\n\n${pick(THORNLORD_DESC, n, 1)}`,
      },
      { title: 'YOUR MISSION', text: 'Break through. Reach the Thornlord. Defeat him.\n\nYou know the way. You always know the way.' },
    ]
  }

  // ── Run 50 milestone ──────────────────────────────────────
  if (n === 50 && MILESTONE_OPENINGS[50]) {
    const panels: CutscenePanel[] = [
      {
        title: 'FIFTY CAMPAIGNS',
        text: pick(MILESTONE_OPENINGS[50], n),
      },
    ]
    panels.push({
      title: 'THE WANDERER',
      text: `You are Jarv. Former tactician of the Dominion's western campaigns. ${pick(JARV_MOODS, n)}\n\nThe army you served no longer exists. The city you lived in is cut off behind a shard wall.\n\n${pick(JARV_INTROS, n, 1)}`,
    })
    panels.push({
      title: 'THE VERDANT SHARD',
      text: `${pick(FOREST_DESC, n, 2)}\n\n${pick(THORNLORD_DESC, n, 1)}`,
    })
    panels.push({ title: 'YOUR MISSION', text: 'Break through. Reach the Thornlord. Defeat him.\n\nYou know the way. You always know the way.' })
    return panels
  }

  // ── Runs 26–49: between 25 and 50 ────────────────────────
  if (n > 25 && n < 50) {
    const ordinal = ordinalWord(n)
    const opening = MID_RUN_OPENINGS[n % MID_RUN_OPENINGS.length](n)
    return [
      { title: `THE ${ordinal} TIME`, text: opening },
      {
        title: 'THE WANDERER',
        text: `You are Jarv. ${pick(JARV_MOODS, n)}\n\n${pick(JARV_INTROS, n, 2)}`,
      },
      {
        title: 'THE VERDANT SHARD',
        text: `${pick(FOREST_DESC, n, 1)}\n\n${pick(THORNLORD_DESC, n)}`,
      },
    ]
  }

  // ── Run 25 milestone ──────────────────────────────────────
  if (n === 25 && MILESTONE_OPENINGS[25]) {
    return [
      { title: 'TWENTY-FIVE', text: pick(MILESTONE_OPENINGS[25], n) },
      {
        title: 'THE WANDERER',
        text: `You are Jarv. ${pick(JARV_MOODS, n)}\n\n${pick(JARV_INTROS, n, 2)}`,
      },
      {
        title: 'THE VERDANT SHARD',
        text: `${pick(FOREST_DESC, n, 1)}\n\n${pick(THORNLORD_DESC, n)}`,
      },
    ]
  }

  // ── Runs 11–24: between 10 and 25 ────────────────────────
  if (n > 10 && n < 25) {
    const ordinal = ordinalWord(n)
    const opening = MID_RUN_OPENINGS[n % MID_RUN_OPENINGS.length](n)
    return [
      { title: `THE ${ordinal} TIME`, text: opening },
      {
        title: 'THE WANDERER',
        text: `You are Jarv. ${pick(JARV_MOODS, n)}\n\n${pick(JARV_INTROS, n, 3)}`,
      },
      {
        title: 'THE VERDANT SHARD',
        text: `${pick(FOREST_DESC, n)}\n\n${pick(THORNLORD_DESC, n)}`,
      },
      { title: 'YOUR MISSION', text: 'Break through the shard. Reach the Thornlord.\n\nYou know how this goes. You\'ve always known how this goes.' },
    ]
  }

  // ── Run 10 milestone ──────────────────────────────────────
  if (n === 10 && MILESTONE_OPENINGS[10]) {
    return [
      { title: 'THE TENTH TIME', text: pick(MILESTONE_OPENINGS[10], n) },
      {
        title: 'THE WANDERER',
        text: `You are Jarv. ${pick(JARV_MOODS, n)}\n\n${pick(JARV_INTROS, n, 3)}`,
      },
      {
        title: 'THE VERDANT SHARD',
        text: `${pick(FOREST_DESC, n)}\n\n${pick(THORNLORD_DESC, n)}`,
      },
      { title: 'YOUR MISSION', text: 'Break through the shard. Reach the Thornlord.\n\nYou know how this goes. You\'ve always known how this goes.' },
    ]
  }

  // ── Runs 5–9 ─────────────────────────────────────────────
  if (n >= 5 && MILESTONE_OPENINGS[5]) {
    const ordinal = ordinalWord(n)
    return [
      { title: `THE ${ordinal} TIME`, text: pick(MILESTONE_OPENINGS[5], n) },
      {
        title: 'THE WANDERER',
        text: `You are Jarv. ${pick(JARV_MOODS, n)}\n\n${pick(JARV_INTROS, n)}`,
      },
      {
        title: 'THE VERDANT SHARD',
        text: `${pick(FOREST_DESC, n)}\n\n${pick(THORNLORD_DESC, n)}`,
      },
    ]
  }

  if (n >= 2) {
    // Summary of last run + subtle deja vu
    const summary = pick(PRIOR_RUN_SUMMARIES, n)
    const opening = pick(PRIOR_RUN_OPENINGS, n)
    return [
      {
        title: 'THE FRACTURE',
        text: `Three years ago, the Grand Dominion shattered.\n\nNot in war. Not gradually. In a single catastrophic instant.\n\n${summary}`,
      },
      {
        title: 'THE WANDERER',
        text: `You are Jarv. ${pick(JARV_MOODS, n)}\n\n${pick(JARV_INTROS, n)}`,
      },
      {
        title: 'THE VERDANT SHARD',
        text: `${pick(FOREST_DESC, n)}\n\n${pick(THORNLORD_DESC, n)}`,
      },
      {
        title: 'A FEELING',
        text: `And yet — ${opening}\n\nYou push the feeling aside. You've always pushed the feeling aside.\n\nThat's how you dreamt it happened, as you step out into the battlefield for the first time.`,
      },
    ]
  }

  // First run: standard intro
  return ACT_1.intro ?? []
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

export const ACT_1: Act = act1Data as Act

export const ACTS: Record<string, Act> = { act1: ACT_1 }
