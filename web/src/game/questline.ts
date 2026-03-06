import { CardRarity } from './types'
import { getCardCatalog } from './cards'

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
const SHRINE_OFFERING_EFFECTS: EventChoice[] = [
  { label: 'Leave an offering', consequence: 'The shrine accepts your gift — restored 12 HP', effect: { type: 'healHp', amount: 12 } },
  { label: 'Leave an offering', consequence: 'The glow brightens — +15 crystals', effect: { type: 'gainCrystals', amount: 15 } },
  { label: 'Leave an offering', consequence: 'The shrine is silent. Nothing happens.', effect: { type: 'nothing' } },
  { label: 'Leave an offering', consequence: 'Something drains your offering — lose 5 HP', effect: { type: 'damageHp', amount: 5 } },
]
const SHRINE_PRAY_EFFECTS: EventChoice[] = [
  { label: 'Pray for strength', consequence: 'A card materialises from the glow — uncommon', effect: { type: 'gainCard', rarity: 'uncommon' } },
  { label: 'Pray for strength', consequence: 'The magic guides your wounds — restored 8 HP', effect: { type: 'healHp', amount: 8 } },
  { label: 'Pray for strength', consequence: 'The shrine tests you — lose 10 HP', effect: { type: 'damageHp', amount: 10 } },
  { label: 'Pray for strength', consequence: 'You feel oddly lucky — +20 crystals', effect: { type: 'gainCrystals', amount: 20 } },
]
const SHRINE_TAKE_EFFECTS: EventChoice[] = [
  { label: 'Pocket the ritual stones', consequence: 'You grab them and run — +18 crystals, lose 8 HP', effect: { type: 'damageHp', amount: 8 } },
  { label: 'Pocket the ritual stones', consequence: 'A common card falls from the stones', effect: { type: 'gainCard', rarity: 'common' } },
  { label: 'Pocket the ritual stones', consequence: 'The stones crumble to dust. Nothing.', effect: { type: 'nothing' } },
  { label: 'Pocket the ritual stones', consequence: 'The shrine curses you — lose 15 HP', effect: { type: 'damageHp', amount: 15 } },
]

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

export const EVENT_CATALOG: Record<string, EventData> = {
  'shrine': generateShrineEvent(), // default (overridden per-visit in App)

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

/**
 * Returns Act 1 intro panels modified based on how many times the campaign has been run.
 * On the first run, returns the standard intro.
 * On subsequent runs, adds references to prior attempts and subtle variations.
 */
export function getAct1Intro(runCount: number): CutscenePanel[] {
  const n = runCount

  // Milestone text overrides (e.g. run 100)
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

  if (n >= 50 && MILESTONE_OPENINGS[50]) {
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

  if (n >= 25 && MILESTONE_OPENINGS[25]) {
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

  if (n >= 10 && MILESTONE_OPENINGS[10]) {
    return [
      { title: 'AGAIN', text: pick(MILESTONE_OPENINGS[10], n) },
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

  if (n >= 5 && MILESTONE_OPENINGS[5]) {
    const ordinals: Record<number, string> = { 5: 'FIFTH', 6: 'SIXTH', 7: 'SEVENTH', 8: 'EIGHTH', 9: 'NINTH' }
    const ordinal = ordinals[n] ?? `${n}TH`
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
    if (!Array.isArray(parsed.completedNodeIds)) parsed.completedNodeIds = []
    if (!Array.isArray(parsed.skippedNodeIds)) parsed.skippedNodeIds = []
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

  intro: [
    {
      title: 'THE FRACTURE',
      text: 'Three years ago, the Grand Dominion shattered.\n\nNot in war. Not gradually. In a single catastrophic instant — a magical detonation the scholars call the Fracture Event. The realm split into isolated shards, each one sealed behind walls of warped space and collapsed ley lines.\n\nNobody knows who caused it. Nobody knows how to undo it.',
    },
    {
      title: 'THE WANDERER',
      text: 'You are Jarv. Former tactician of the Dominion\'s western campaigns. Now, technically, unemployed.\n\nThe army you served no longer exists. The city you lived in is cut off behind a shard wall. The people you knew are either dead, stranded, or figuring out their own problems.\n\nYou have a deck of cards, a vague sense of mission, and the navigational instincts of someone who has been lost before and considers it acceptable.',
    },
    {
      title: 'THE VERDANT SHARD',
      text: 'Your compass points to the nearest reachable shard — a dense, ancient forest realm that has grown wild and hostile since the Fracture closed its borders.\n\nThe shard\'s guardian, a being called the Thornlord, has sealed its internal pathways. Local traders say he was old before the Dominion was founded.\n\nLocal traders also say he hasn\'t spoken to anyone in forty years. You\'re choosing to interpret that as optimistically as possible.',
    },
    {
      title: 'YOUR MISSION',
      text: 'Break through the shard. Reach the Thornlord. Defeat him. Earn passage.\n\nTake whatever cards and crystals you can carry out the other side — your collection grows with every run, your mastery deepens, and somewhere in the Fractured Core the answer to all of this is waiting.\n\nProbably.',
    },
  ],

  outro: [
    {
      title: 'THE THORNLORD FALLS',
      text: 'The ancient guardian crumples. Roots unravel. Bark splits along fracture lines older than the Dominion.\n\nFor a moment the whole forest holds its breath — then it exhales. The sealed pathways glow faintly and open like doors that have been waiting for exactly this.',
    },
    {
      title: 'WHAT HE WAS',
      text: 'The Thornlord was not evil. He was old, and afraid, and doing what guardians do when the world stops making sense.\n\nYou take the Bark Shield he leaves behind. Not as a trophy. As a reminder that some things only break because nothing else would hold.',
    },
    {
      title: 'THE ROAD AHEAD',
      text: 'One shard cleared. The ley lines pulse — faint, but connected.\n\nYour deck returns to its bones. Your collection carries forward. Somewhere beyond the Verdant Shard, the Iron Citadel waits — and whoever controls it will not be glad to see you.\n\nGood.',
    },
  ],

  nodes: {
    // ── Row 0 ─────────────────────────────────────────────
    'goblin-raid': {
      id: 'goblin-raid', type: 'battle',
      label: 'Goblin Raiders',
      description: 'A rowdy mob has blockaded the trade route. Clear them out.',
      row: 0, col: 0, rowCols: 1,
      parentIds: [], childIds: ['camp', 'shrine', 'patrol'],
      handicap: 10,   // commons + uncommons only — manageable for a starter deck
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
      handicap: 7,    // uncommons max — slightly harder second battle
    },
    // ── Row 2 ─────────────────────────────────────────────
    'ambush': {
      id: 'ambush', type: 'battle',
      label: 'The Ambush',
      description: 'Something ancient was waiting in the treeline.',
      row: 2, col: 0, rowCols: 1,
      parentIds: ['camp', 'shrine', 'patrol'], childIds: ['ruins', 'war-camp', 'market'],
      handicap: 4,    // rares allowed, no legendaries — mid-act difficulty step-up
    },
    // ── Row 3 — three-way branch ──────────────────────────
    'ruins': {
      id: 'ruins', type: 'event',
      label: 'Watchtower Ruins',
      description: 'A crumbling garrison tower leans against the treeline.',
      row: 3, col: 0, rowCols: 3,
      parentIds: ['ambush'], childIds: ['captain'],
      eventId: 'ruins',
    },
    'war-camp': {
      id: 'war-camp', type: 'battle',
      label: 'War Camp',
      description: 'A fortified enemy camp blocks the road ahead.',
      row: 3, col: 1, rowCols: 3,
      parentIds: ['ambush'], childIds: ['captain'],
      handicap: 3,    // rares allowed, no legendaries
    },
    'market': {
      id: 'market', type: 'merchant',
      label: 'Travelling Market',
      description: 'A merchant cart half-hidden in the underbrush. She waves you over.',
      row: 3, col: 2, rowCols: 3,
      parentIds: ['ambush'], childIds: ['captain'],
    },
    // ── Row 4 ─────────────────────────────────────────────
    'captain': {
      id: 'captain', type: 'elite',
      label: 'Siege Captain',
      description: 'A hardened veteran with well-drilled siege troops.',
      row: 4, col: 0, rowCols: 1,
      parentIds: ['ruins', 'war-camp', 'market'], childIds: ['thornlord'],
      handicap: 1,    // full deck including legendaries — elite fight
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
      bossDialogue: [
        '"You carry the smell of the shattered world."',
        '"I sealed these paths to keep the rot from spreading. Clearly I should have built higher walls."',
        '"You will not pass. The Verdant Shard does not need another wandering tactician."',
      ],
    },
  },
}

export const ACTS: Record<string, Act> = { act1: ACT_1 }
