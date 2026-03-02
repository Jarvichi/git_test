import { Card, CardRarity, CardType, UnitTemplate, UpgradeEffect } from './types'

let _id = 0
const uid = () => `card-${++_id}`

// ─── Card Definition Schema ───────────────────────────────

interface CardDef {
  name: string
  rarity: CardRarity
  cost: number
  cardType: CardType
  unit?: UnitTemplate
  upgradeEffect?: UpgradeEffect
  description: string
  /** How many copies go in the default makeDeck() */
  deckCount: number
}

// ─── Shared Unit Templates ────────────────────────────────

export const GOBLIN_UNIT: UnitTemplate = {
  name: 'Goblin', attack: 3, maxHp: 10, isWall: false, bypassWall: false,
  moveSpeed: 45, attackRange: 5, attackCooldownMs: 1000,
}
export const ARCHER_UNIT: UnitTemplate = {
  name: 'Archer', attack: 3, maxHp: 8, isWall: false, bypassWall: true,
  moveSpeed: 28, attackRange: 80, attackCooldownMs: 1500,
}
export const DRAGON_UNIT: UnitTemplate = {
  name: 'Dragon', attack: 10, maxHp: 30, isWall: false, bypassWall: true,
  moveSpeed: 18, attackRange: 50, attackCooldownMs: 3000,
}

// ─── Master Card Catalog ──────────────────────────────────

const CARD_DEFS: CardDef[] = [
  // ── Units ──────────────────────────────────────────────
  {
    name: 'Goblin', rarity: 'common', cost: 1, cardType: 'unit',
    unit: GOBLIN_UNIT,
    description: 'Fast melee fighter.',
    deckCount: 3,
  },
  {
    name: 'Archer', rarity: 'common', cost: 1, cardType: 'unit',
    unit: ARCHER_UNIT,
    description: 'Ranged — fires over walls.',
    deckCount: 3,
  },
  {
    name: 'Barbarian', rarity: 'uncommon', cost: 2, cardType: 'unit',
    unit: {
      name: 'Barbarian', attack: 7, maxHp: 15, isWall: false, bypassWall: false,
      moveSpeed: 35, attackRange: 5, attackCooldownMs: 1800,
    },
    description: 'Hard-hitting melee fighter.',
    deckCount: 3,
  },
  {
    name: 'Knight', rarity: 'uncommon', cost: 2, cardType: 'unit',
    unit: {
      name: 'Knight', attack: 4, maxHp: 25, isWall: false, bypassWall: false,
      moveSpeed: 22, attackRange: 5, attackCooldownMs: 1500,
    },
    description: 'Armored frontline tank.',
    deckCount: 3,
  },
  {
    name: 'Wizard', rarity: 'rare', cost: 3, cardType: 'unit',
    unit: {
      name: 'Wizard', attack: 6, maxHp: 10, isWall: false, bypassWall: true,
      moveSpeed: 22, attackRange: 70, attackCooldownMs: 2000,
    },
    description: 'Magic bypasses walls.',
    deckCount: 2,
  },
  {
    name: 'Dragon', rarity: 'legendary', cost: 4, cardType: 'unit',
    unit: DRAGON_UNIT,
    description: 'Unstoppable aerial might.',
    deckCount: 1,
  },
  // ── Structures ─────────────────────────────────────────
  {
    name: 'Build Wall', rarity: 'common', cost: 1, cardType: 'structure',
    unit: {
      name: 'Wall', attack: 0, maxHp: 40, isWall: true, bypassWall: false,
      moveSpeed: 0, attackRange: 0, attackCooldownMs: 0,
    },
    description: 'Blocks melee units.',
    deckCount: 3,
  },
  {
    name: 'Build Farm', rarity: 'uncommon', cost: 2, cardType: 'structure',
    unit: {
      name: 'Farm', attack: 0, maxHp: 20, isWall: false, bypassWall: false,
      moveSpeed: 0, attackRange: 0, attackCooldownMs: 0,
      structureEffect: { type: 'mana', amount: 1 },
    },
    description: '+1 max mana while standing.',
    deckCount: 2,
  },
  {
    name: 'Barracks', rarity: 'uncommon', cost: 2, cardType: 'structure',
    unit: {
      name: 'Barracks', attack: 0, maxHp: 25, isWall: false, bypassWall: false,
      moveSpeed: 0, attackRange: 0, attackCooldownMs: 0,
      structureEffect: { type: 'spawn', unitTemplate: GOBLIN_UNIT, intervalMs: 8000 },
    },
    description: 'Spawns a Goblin every 8s.',
    deckCount: 2,
  },
  {
    name: 'Arcane Tower', rarity: 'rare', cost: 3, cardType: 'structure',
    unit: {
      name: 'Arc.Tower', attack: 0, maxHp: 20, isWall: false, bypassWall: false,
      moveSpeed: 0, attackRange: 0, attackCooldownMs: 0,
      structureEffect: { type: 'spawn', unitTemplate: ARCHER_UNIT, intervalMs: 12000 },
    },
    description: 'Spawns an Archer every 12s.',
    deckCount: 1,
  },
  {
    name: 'Dragon Lair', rarity: 'legendary', cost: 5, cardType: 'structure',
    unit: {
      name: 'DrgnLair', attack: 0, maxHp: 30, isWall: false, bypassWall: false,
      moveSpeed: 0, attackRange: 0, attackCooldownMs: 0,
      structureEffect: { type: 'spawn', unitTemplate: DRAGON_UNIT, intervalMs: 25000 },
    },
    description: 'Spawns a Dragon every 25s.',
    deckCount: 1,
  },
  // ── Upgrades ───────────────────────────────────────────
  {
    name: 'Sharpen Blades', rarity: 'uncommon', cost: 2, cardType: 'upgrade',
    upgradeEffect: { type: 'buffAttack', amount: 2 },
    description: 'All your units gain +2 attack.',
    deckCount: 2,
  },
  {
    name: 'Fortify', rarity: 'rare', cost: 2, cardType: 'upgrade',
    upgradeEffect: { type: 'healUnits', amount: 8 },
    description: 'Heal all your units for 8 HP.',
    deckCount: 1,
  },
]

// ─── Public API ───────────────────────────────────────────

/** One Card instance per card type — used for display and collection lookups. */
export function getCardCatalog(): Card[] {
  return CARD_DEFS.map(def => ({
    id: `cat-${def.name}`,
    name: def.name,
    rarity: def.rarity,
    cost: def.cost,
    cardType: def.cardType,
    unit: def.unit,
    upgradeEffect: def.upgradeEffect,
    description: def.description,
  }))
}

/** Build the default deck (used by opponent AI and as fallback). */
export function makeDeck(): Card[] {
  const result: Card[] = []
  for (const def of CARD_DEFS) {
    for (let i = 0; i < def.deckCount; i++) {
      result.push({
        id: uid(),
        name: def.name,
        rarity: def.rarity,
        cost: def.cost,
        cardType: def.cardType,
        unit: def.unit,
        upgradeEffect: def.upgradeEffect,
        description: def.description,
      })
    }
  }
  return result
}

export function rarityStars(r: CardRarity): string {
  return '\u2605'.repeat({ common: 1, uncommon: 2, rare: 3, legendary: 4 }[r])
}
