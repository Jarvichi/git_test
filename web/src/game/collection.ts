import { Card } from './types'
import { getCardCatalog } from './cards'

// ─── Types ────────────────────────────────────────────────

export interface CollectionEntry {
  cardName: string
  count: number
}

export interface DeckEntry {
  cardName: string
  count: number
}

// ─── Constants ────────────────────────────────────────────

const COLLECTION_KEY = 'jarv_collection'
const DECK_KEY = 'jarv_deck'

export const DECK_MIN = 10
export const DECK_MAX = 30
export const COPIES_MAX = 4

// ─── Starter data ─────────────────────────────────────────

export const STARTER_COLLECTION: CollectionEntry[] = [
  { cardName: 'Goblin',         count: 4 },
  { cardName: 'Archer',         count: 4 },
  { cardName: 'Barbarian',      count: 3 },
  { cardName: 'Knight',         count: 3 },
  { cardName: 'Wizard',         count: 1 },
  { cardName: 'Build Wall',     count: 4 },
  { cardName: 'Build Farm',     count: 2 },
  { cardName: 'Barracks',       count: 1 },
  { cardName: 'Sharpen Blades', count: 2 },
  { cardName: 'Fortify',        count: 1 },
]

export const STARTER_DECK: DeckEntry[] = [
  { cardName: 'Goblin',         count: 3 },
  { cardName: 'Archer',         count: 3 },
  { cardName: 'Barbarian',      count: 2 },
  { cardName: 'Knight',         count: 2 },
  { cardName: 'Build Wall',     count: 2 },
  { cardName: 'Build Farm',     count: 1 },
  { cardName: 'Sharpen Blades', count: 1 },
]

// ─── Collection CRUD ──────────────────────────────────────

export function loadCollection(): CollectionEntry[] {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY)
    if (raw) return JSON.parse(raw) as CollectionEntry[]
  } catch { /* ignore */ }
  saveCollection(STARTER_COLLECTION)
  return [...STARTER_COLLECTION.map(e => ({ ...e }))]
}

export function saveCollection(c: CollectionEntry[]): void {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(c))
}

export function addCardsToCollection(newCards: CollectionEntry[]): CollectionEntry[] {
  const collection = loadCollection()
  for (const entry of newCards) {
    const existing = collection.find(e => e.cardName === entry.cardName)
    if (existing) {
      existing.count += entry.count
    } else {
      collection.push({ ...entry })
    }
  }
  saveCollection(collection)
  return collection
}

export function getOwnedCount(collection: CollectionEntry[], cardName: string): number {
  return collection.find(e => e.cardName === cardName)?.count ?? 0
}

// ─── Deck CRUD ────────────────────────────────────────────

export function loadDeck(): DeckEntry[] {
  try {
    const raw = localStorage.getItem(DECK_KEY)
    if (raw) return JSON.parse(raw) as DeckEntry[]
  } catch { /* ignore */ }
  saveDeck(STARTER_DECK)
  return [...STARTER_DECK.map(e => ({ ...e }))]
}

export function saveDeck(d: DeckEntry[]): void {
  localStorage.setItem(DECK_KEY, JSON.stringify(d))
}

export function deckTotalCards(d: DeckEntry[]): number {
  return d.reduce((s, e) => s + e.count, 0)
}

export function isDeckValid(d: DeckEntry[]): boolean {
  const total = deckTotalCards(d)
  return total >= DECK_MIN && total <= DECK_MAX
}

// ─── Build Card[] from DeckEntry[] ───────────────────────

let _deckCardId = 0

export function buildDeckCards(entries: DeckEntry[]): Card[] {
  const catalog = getCardCatalog()
  const result: Card[] = []
  for (const entry of entries) {
    const template = catalog.find(c => c.name === entry.cardName)
    if (!template) continue
    for (let i = 0; i < entry.count; i++) {
      result.push({ ...template, id: `deck-${entry.cardName}-${++_deckCardId}` })
    }
  }
  return result
}

// ─── Pack Generation ──────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Returns 5 card names in reveal order.
 * Guaranteed: 2 commons, 1 uncommon, 1 rare, 1 bonus (10% legendary / 20% rare / 70% uncommon).
 */
export function generatePack(): string[] {
  const catalog = getCardCatalog()
  const commons    = catalog.filter(c => c.rarity === 'common')
  const uncommons  = catalog.filter(c => c.rarity === 'uncommon')
  const rares      = catalog.filter(c => c.rarity === 'rare')
  const legendaries = catalog.filter(c => c.rarity === 'legendary')

  const picks: string[] = [
    pickRandom(commons).name,
    pickRandom(commons).name,
    pickRandom(uncommons).name,
    pickRandom(rares).name,
  ]

  const r = Math.random()
  if (r < 0.10 && legendaries.length > 0) {
    picks.push(pickRandom(legendaries).name)
  } else if (r < 0.30 && rares.length > 0) {
    picks.push(pickRandom(rares).name)
  } else {
    picks.push(pickRandom(uncommons).name)
  }

  return picks
}
