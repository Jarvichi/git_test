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
  name: 'Dragon', attack: 10, maxHp: 30, isWall: false, bypassWall: true, flying: true,
  moveSpeed: 18, attackRange: 50, attackCooldownMs: 3000,
}

// ── New unit templates ────────────────────────────────────────────────────────

const SKELETON_UNIT: UnitTemplate = {
  name: 'Skeleton', attack: 2, maxHp: 8, isWall: false, bypassWall: false,
  moveSpeed: 52, attackRange: 5, attackCooldownMs: 800,
}
const TROLL_UNIT: UnitTemplate = {
  name: 'Troll', attack: 10, maxHp: 45, isWall: false, bypassWall: false,
  moveSpeed: 12, attackRange: 5, attackCooldownMs: 2200,
}
const CROSSBOW_UNIT: UnitTemplate = {
  name: 'Crossbow', attack: 5, maxHp: 14, isWall: false, bypassWall: true,
  moveSpeed: 25, attackRange: 65, attackCooldownMs: 2000,
}
const PALADIN_UNIT: UnitTemplate = {
  name: 'Paladin', attack: 7, maxHp: 40, isWall: false, bypassWall: false,
  moveSpeed: 16, attackRange: 5, attackCooldownMs: 1800,
}
const ROGUE_UNIT: UnitTemplate = {
  name: 'Rogue', attack: 8, maxHp: 11, isWall: false, bypassWall: false, climber: true,
  moveSpeed: 58, attackRange: 5, attackCooldownMs: 1200,
}
const CATAPULT_UNIT: UnitTemplate = {
  name: 'Catapult', attack: 18, maxHp: 12, isWall: false, bypassWall: true,
  moveSpeed: 10, attackRange: 110, attackCooldownMs: 4000,
}
const WEREWOLF_UNIT: UnitTemplate = {
  name: 'Werewolf', attack: 9, maxHp: 22, isWall: false, bypassWall: false, climber: true,
  moveSpeed: 62, attackRange: 5, attackCooldownMs: 1400,
}
const GOLEM_UNIT: UnitTemplate = {
  name: 'Golem', attack: 14, maxHp: 70, isWall: false, bypassWall: false,
  moveSpeed: 8, attackRange: 5, attackCooldownMs: 2500,
}
const PIXIE_UNIT: UnitTemplate = {
  name: 'Pixie', attack: 2, maxHp: 6, isWall: false, bypassWall: true, flying: true,
  moveSpeed: 42, attackRange: 75, attackCooldownMs: 1000,
}
const OGRE_UNIT: UnitTemplate = {
  name: 'Ogre', attack: 11, maxHp: 32, isWall: false, bypassWall: false,
  moveSpeed: 18, attackRange: 5, attackCooldownMs: 2000,
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

  // ══ NEW UNITS (deckCount: 0 — available via card packs) ══════════════════
  { name: 'Skeleton', rarity: 'common',   cost: 1, cardType: 'unit', unit: SKELETON_UNIT,
    description: 'Frail but lightning-fast melee.', deckCount: 0 },
  { name: 'Troll',    rarity: 'uncommon', cost: 3, cardType: 'unit', unit: TROLL_UNIT,
    description: 'Massive melee brute. Very slow.', deckCount: 0 },
  { name: 'Crossbow', rarity: 'uncommon', cost: 2, cardType: 'unit', unit: CROSSBOW_UNIT,
    description: 'Ranged soldier — fires over walls.', deckCount: 0 },
  { name: 'Paladin',  rarity: 'rare',     cost: 4, cardType: 'unit', unit: PALADIN_UNIT,
    description: 'Holy knight — armored and mighty.', deckCount: 0 },
  { name: 'Rogue',    rarity: 'uncommon', cost: 2, cardType: 'unit', unit: ROGUE_UNIT,
    description: 'Climbs over walls at 25 % speed.', deckCount: 0 },
  { name: 'Catapult', rarity: 'rare',     cost: 4, cardType: 'unit', unit: CATAPULT_UNIT,
    description: 'Extreme range. Fires over everything.', deckCount: 0 },
  { name: 'Werewolf', rarity: 'rare',     cost: 3, cardType: 'unit', unit: WEREWOLF_UNIT,
    description: 'Climbs over walls. Ferocious speed.', deckCount: 0 },
  { name: 'Golem',    rarity: 'legendary',cost: 5, cardType: 'unit', unit: GOLEM_UNIT,
    description: 'Stone titan — massive HP and damage.', deckCount: 0 },
  { name: 'Pixie',    rarity: 'common',   cost: 1, cardType: 'unit', unit: PIXIE_UNIT,
    description: 'Tiny and flying — bypasses all walls.', deckCount: 0 },
  { name: 'Ogre',     rarity: 'uncommon', cost: 3, cardType: 'unit', unit: OGRE_UNIT,
    description: 'Hulking melee powerhouse.', deckCount: 0 },

  // ══ NEW SPAWNER BUILDINGS (deckCount: 0) ══════════════════════════════════
  { name: 'Crypt',       rarity: 'rare',      cost: 3, cardType: 'structure',
    unit: { name: 'Crypt',       attack: 0, maxHp: 20, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: SKELETON_UNIT, intervalMs: 7000 } },
    description: 'Spawns a Skeleton every 7s.', deckCount: 0 },
  { name: 'Troll Den',   rarity: 'legendary', cost: 5, cardType: 'structure',
    unit: { name: 'Troll Den',   attack: 0, maxHp: 35, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: TROLL_UNIT, intervalMs: 20000 } },
    description: 'Spawns a Troll every 20s.', deckCount: 0 },
  { name: 'Garrison',    rarity: 'rare',      cost: 3, cardType: 'structure',
    unit: { name: 'Garrison',    attack: 0, maxHp: 22, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: CROSSBOW_UNIT, intervalMs: 10000 } },
    description: 'Spawns a Crossbow every 10s.', deckCount: 0 },
  { name: 'Cathedral',   rarity: 'legendary', cost: 6, cardType: 'structure',
    unit: { name: 'Cathedral',   attack: 0, maxHp: 40, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: PALADIN_UNIT, intervalMs: 25000 } },
    description: 'Spawns a Paladin every 25s.', deckCount: 0 },
  { name: 'Rogue Den',   rarity: 'rare',      cost: 3, cardType: 'structure',
    unit: { name: 'Rogue Den',   attack: 0, maxHp: 18, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: ROGUE_UNIT, intervalMs: 9000 } },
    description: 'Spawns a Rogue every 9s.', deckCount: 0 },
  { name: 'Siege Works', rarity: 'legendary', cost: 5, cardType: 'structure',
    unit: { name: 'Siege Works', attack: 0, maxHp: 25, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: CATAPULT_UNIT, intervalMs: 28000 } },
    description: 'Spawns a Catapult every 28s.', deckCount: 0 },
  { name: 'Dark Shrine', rarity: 'rare',      cost: 4, cardType: 'structure',
    unit: { name: 'Dark Shrine', attack: 0, maxHp: 22, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: WEREWOLF_UNIT, intervalMs: 14000 } },
    description: 'Spawns a Werewolf every 14s.', deckCount: 0 },
  { name: 'Iron Forge',  rarity: 'legendary', cost: 6, cardType: 'structure',
    unit: { name: 'Iron Forge',  attack: 0, maxHp: 45, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: GOLEM_UNIT, intervalMs: 35000 } },
    description: 'Spawns a Golem every 35s.', deckCount: 0 },
  { name: 'Fairy Ring',  rarity: 'uncommon',  cost: 2, cardType: 'structure',
    unit: { name: 'Fairy Ring',  attack: 0, maxHp: 15, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: PIXIE_UNIT, intervalMs: 7000 } },
    description: 'Spawns a Pixie every 7s.', deckCount: 0 },
  { name: 'Ogre Den',    rarity: 'rare',      cost: 3, cardType: 'structure',
    unit: { name: 'Ogre Den',    attack: 0, maxHp: 28, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: OGRE_UNIT, intervalMs: 16000 } },
    description: 'Spawns an Ogre every 16s.', deckCount: 0 },

  // ══ NEW UPGRADE CARDS (deckCount: 0) ══════════════════════════════════════
  { name: 'Rally',      rarity: 'common',   cost: 1, cardType: 'upgrade',
    upgradeEffect: { type: 'healUnits',  amount: 4  }, description: 'Heal all your units for 4 HP.',              deckCount: 0 },
  { name: 'Haste',      rarity: 'uncommon', cost: 2, cardType: 'upgrade',
    upgradeEffect: { type: 'buffSpeed',  amount: 12 }, description: 'All your units gain +12 speed.',             deckCount: 0 },
  { name: 'Iron Skin',  rarity: 'uncommon', cost: 2, cardType: 'upgrade',
    upgradeEffect: { type: 'buffMaxHp',  amount: 15 }, description: 'All your units gain +15 max HP.',            deckCount: 0 },
  { name: 'Eagle Eye',  rarity: 'uncommon', cost: 2, cardType: 'upgrade',
    upgradeEffect: { type: 'buffRange',  amount: 25 }, description: 'All your units gain +25 attack range.',      deckCount: 0 },
  { name: 'War Drums',  rarity: 'rare',     cost: 3, cardType: 'upgrade',
    upgradeEffect: { type: 'buffAttack', amount: 5  }, description: 'All your units gain +5 attack.',             deckCount: 0 },
  { name: 'Bloodlust',  rarity: 'rare',     cost: 3, cardType: 'upgrade',
    upgradeEffect: { type: 'buffSpeed',  amount: 25 }, description: 'All your units surge with furious speed.',   deckCount: 0 },
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
