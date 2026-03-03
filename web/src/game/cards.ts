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

// ── Unit templates batch 2 ────────────────────────────────────────────────────

const PLAGUE_RAT_UNIT: UnitTemplate = {
  name: 'Plague Rat', attack: 2, maxHp: 6, isWall: false, bypassWall: false,
  moveSpeed: 75, attackRange: 5, attackCooldownMs: 500,
}
const BANDIT_UNIT: UnitTemplate = {
  name: 'Bandit', attack: 4, maxHp: 9, isWall: false, bypassWall: false, climber: true,
  moveSpeed: 55, attackRange: 5, attackCooldownMs: 1100,
}
const BAT_UNIT: UnitTemplate = {
  name: 'Bat', attack: 2, maxHp: 5, isWall: false, bypassWall: false, flying: true,
  moveSpeed: 65, attackRange: 5, attackCooldownMs: 700,
}
const SCORPION_UNIT: UnitTemplate = {
  name: 'Scorpion', attack: 5, maxHp: 14, isWall: false, bypassWall: false,
  moveSpeed: 35, attackRange: 5, attackCooldownMs: 1300,
}
const SHIELD_GUARD_UNIT: UnitTemplate = {
  name: 'Shield Guard', attack: 3, maxHp: 40, isWall: false, bypassWall: false,
  moveSpeed: 15, attackRange: 5, attackCooldownMs: 2200,
}
const CENTAUR_UNIT: UnitTemplate = {
  name: 'Centaur', attack: 4, maxHp: 18, isWall: false, bypassWall: true,
  moveSpeed: 42, attackRange: 70, attackCooldownMs: 1800,
}
const HARPY_UNIT: UnitTemplate = {
  name: 'Harpy', attack: 4, maxHp: 14, isWall: false, bypassWall: true, flying: true,
  moveSpeed: 40, attackRange: 65, attackCooldownMs: 1500,
}
const SPECTER_UNIT: UnitTemplate = {
  name: 'Specter', attack: 5, maxHp: 10, isWall: false, bypassWall: false, flying: true,
  moveSpeed: 50, attackRange: 5, attackCooldownMs: 1000,
}
const LIZARDMAN_UNIT: UnitTemplate = {
  name: 'Lizardman', attack: 6, maxHp: 18, isWall: false, bypassWall: false, climber: true,
  moveSpeed: 32, attackRange: 5, attackCooldownMs: 1600,
}
const BALLISTA_UNIT: UnitTemplate = {
  name: 'Ballista', attack: 8, maxHp: 10, isWall: false, bypassWall: true,
  moveSpeed: 12, attackRange: 100, attackCooldownMs: 3000,
}
const VAMPIRE_UNIT: UnitTemplate = {
  name: 'Vampire', attack: 7, maxHp: 18, isWall: false, bypassWall: false, flying: true,
  moveSpeed: 50, attackRange: 5, attackCooldownMs: 1400,
}
const GRIFFIN_UNIT: UnitTemplate = {
  name: 'Griffin', attack: 9, maxHp: 25, isWall: false, bypassWall: true, flying: true,
  moveSpeed: 32, attackRange: 60, attackCooldownMs: 2200,
}
const FIRE_MAGE_UNIT: UnitTemplate = {
  name: 'Fire Mage', attack: 11, maxHp: 12, isWall: false, bypassWall: true,
  moveSpeed: 18, attackRange: 75, attackCooldownMs: 2500,
}
const EXECUTIONER_UNIT: UnitTemplate = {
  name: 'Executioner', attack: 16, maxHp: 18, isWall: false, bypassWall: false,
  moveSpeed: 14, attackRange: 5, attackCooldownMs: 2000,
}
const MAMMOTH_UNIT: UnitTemplate = {
  name: 'Mammoth', attack: 12, maxHp: 55, isWall: false, bypassWall: false,
  moveSpeed: 11, attackRange: 5, attackCooldownMs: 2600,
}
const DARK_ELF_UNIT: UnitTemplate = {
  name: 'Dark Elf', attack: 5, maxHp: 14, isWall: false, bypassWall: true, climber: true,
  moveSpeed: 45, attackRange: 70, attackCooldownMs: 1600,
}
const NECROMANCER_UNIT: UnitTemplate = {
  name: 'Necromancer', attack: 7, maxHp: 10, isWall: false, bypassWall: true,
  moveSpeed: 16, attackRange: 80, attackCooldownMs: 2200,
}
const GIANT_UNIT: UnitTemplate = {
  name: 'Giant', attack: 18, maxHp: 65, isWall: false, bypassWall: false,
  moveSpeed: 9, attackRange: 5, attackCooldownMs: 3000,
}
const WYVERN_UNIT: UnitTemplate = {
  name: 'Wyvern', attack: 12, maxHp: 28, isWall: false, bypassWall: true, flying: true,
  moveSpeed: 38, attackRange: 55, attackCooldownMs: 2000,
}
const BEHEMOTH_UNIT: UnitTemplate = {
  name: 'Behemoth', attack: 22, maxHp: 90, isWall: false, bypassWall: false,
  moveSpeed: 7, attackRange: 5, attackCooldownMs: 3500,
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

  // ══ BATCH 2: 20 NEW UNITS ════════════════════════════════════════════════════
  { name: 'Plague Rat',  rarity: 'common',    cost: 1, cardType: 'unit', unit: PLAGUE_RAT_UNIT,
    description: 'Swarm melee. Incredibly fast attack speed.', deckCount: 2 },
  { name: 'Bandit',      rarity: 'common',    cost: 1, cardType: 'unit', unit: BANDIT_UNIT,
    description: 'Fast climber — scales over walls.', deckCount: 2 },
  { name: 'Bat',         rarity: 'common',    cost: 1, cardType: 'unit', unit: BAT_UNIT,
    description: 'Tiny flier — ignores walls entirely.', deckCount: 2 },
  { name: 'Scorpion',    rarity: 'common',    cost: 1, cardType: 'unit', unit: SCORPION_UNIT,
    description: 'Sturdy melee with decent punch.', deckCount: 2 },
  { name: 'Shield Guard',rarity: 'uncommon',  cost: 2, cardType: 'unit', unit: SHIELD_GUARD_UNIT,
    description: 'Immovable melee wall — extreme HP.', deckCount: 2 },
  { name: 'Centaur',     rarity: 'uncommon',  cost: 2, cardType: 'unit', unit: CENTAUR_UNIT,
    description: 'Fast ranged — fires over walls.', deckCount: 2 },
  { name: 'Harpy',       rarity: 'uncommon',  cost: 2, cardType: 'unit', unit: HARPY_UNIT,
    description: 'Flying ranged — swoops over walls and shoots.', deckCount: 2 },
  { name: 'Specter',     rarity: 'uncommon',  cost: 2, cardType: 'unit', unit: SPECTER_UNIT,
    description: 'Flying melee — phases through walls.', deckCount: 2 },
  { name: 'Lizardman',   rarity: 'uncommon',  cost: 2, cardType: 'unit', unit: LIZARDMAN_UNIT,
    description: 'Climbing melee brawler.', deckCount: 2 },
  { name: 'Ballista',    rarity: 'uncommon',  cost: 3, cardType: 'unit', unit: BALLISTA_UNIT,
    description: 'Siege bolt — extreme range, fires over walls.', deckCount: 1 },
  { name: 'Vampire',     rarity: 'rare',      cost: 3, cardType: 'unit', unit: VAMPIRE_UNIT,
    description: 'Flying melee predator — ignores walls.', deckCount: 1 },
  { name: 'Griffin',     rarity: 'rare',      cost: 3, cardType: 'unit', unit: GRIFFIN_UNIT,
    description: 'Flying ranged — powerful aerial attacker.', deckCount: 1 },
  { name: 'Fire Mage',   rarity: 'rare',      cost: 3, cardType: 'unit', unit: FIRE_MAGE_UNIT,
    description: 'Glass cannon — scorches enemies through walls.', deckCount: 1 },
  { name: 'Executioner', rarity: 'rare',      cost: 3, cardType: 'unit', unit: EXECUTIONER_UNIT,
    description: 'Devastating melee blow — one hit, one kill.', deckCount: 1 },
  { name: 'Mammoth',     rarity: 'rare',      cost: 4, cardType: 'unit', unit: MAMMOTH_UNIT,
    description: 'Armored beast — crushes through melee lines.', deckCount: 1 },
  { name: 'Dark Elf',    rarity: 'rare',      cost: 3, cardType: 'unit', unit: DARK_ELF_UNIT,
    description: 'Ranged climber — scales walls then snipes.', deckCount: 1 },
  { name: 'Necromancer', rarity: 'rare',      cost: 3, cardType: 'unit', unit: NECROMANCER_UNIT,
    description: 'Long-range magic — bypasses walls.', deckCount: 1 },
  { name: 'Giant',       rarity: 'legendary', cost: 5, cardType: 'unit', unit: GIANT_UNIT,
    description: 'Towering brute — enormous HP and damage.', deckCount: 1 },
  { name: 'Wyvern',      rarity: 'legendary', cost: 4, cardType: 'unit', unit: WYVERN_UNIT,
    description: 'Fast flying ranged — dominates from the air.', deckCount: 1 },
  { name: 'Behemoth',    rarity: 'legendary', cost: 6, cardType: 'unit', unit: BEHEMOTH_UNIT,
    description: 'Ultimate melee titan — nearly unstoppable.', deckCount: 1 },

  // ══ BATCH 2: SPAWN BUILDINGS ═════════════════════════════════════════════════
  { name: 'Rat Burrow',    rarity: 'common',    cost: 1, cardType: 'structure',
    unit: { name: 'Rat Burrow',    attack: 0, maxHp: 14, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: PLAGUE_RAT_UNIT, intervalMs: 5000 } },
    description: 'Spawns a Plague Rat every 5s.', deckCount: 2 },
  { name: 'Bandit Camp',   rarity: 'common',    cost: 2, cardType: 'structure',
    unit: { name: 'Bandit Camp',   attack: 0, maxHp: 18, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: BANDIT_UNIT,     intervalMs: 8000 } },
    description: 'Spawns a Bandit every 8s.', deckCount: 2 },
  { name: 'Bat Cave',      rarity: 'common',    cost: 1, cardType: 'structure',
    unit: { name: 'Bat Cave',      attack: 0, maxHp: 14, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: BAT_UNIT,        intervalMs: 6000 } },
    description: 'Spawns a Bat every 6s.', deckCount: 2 },
  { name: 'Scorpion Pit',  rarity: 'uncommon',  cost: 2, cardType: 'structure',
    unit: { name: 'Scorpion Pit',  attack: 0, maxHp: 20, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: SCORPION_UNIT,   intervalMs: 9000 } },
    description: 'Spawns a Scorpion every 9s.', deckCount: 1 },
  { name: 'Guard Post',    rarity: 'uncommon',  cost: 2, cardType: 'structure',
    unit: { name: 'Guard Post',    attack: 0, maxHp: 22, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: SHIELD_GUARD_UNIT, intervalMs: 16000 } },
    description: 'Spawns a Shield Guard every 16s.', deckCount: 1 },
  { name: 'Centaur Stable',rarity: 'uncommon',  cost: 3, cardType: 'structure',
    unit: { name: 'Cntaur Stbl',   attack: 0, maxHp: 22, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: CENTAUR_UNIT,    intervalMs: 12000 } },
    description: 'Spawns a Centaur every 12s.', deckCount: 1 },
  { name: 'Harpy Roost',   rarity: 'uncommon',  cost: 3, cardType: 'structure',
    unit: { name: 'Harpy Roost',   attack: 0, maxHp: 18, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: HARPY_UNIT,      intervalMs: 12000 } },
    description: 'Spawns a Harpy every 12s.', deckCount: 1 },
  { name: 'Spirit Well',   rarity: 'rare',      cost: 3, cardType: 'structure',
    unit: { name: 'Spirit Well',   attack: 0, maxHp: 18, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: SPECTER_UNIT,    intervalMs: 10000 } },
    description: 'Spawns a Specter every 10s.', deckCount: 1 },
  { name: 'Lizard Warren', rarity: 'uncommon',  cost: 2, cardType: 'structure',
    unit: { name: 'Lizard Den',    attack: 0, maxHp: 20, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: LIZARDMAN_UNIT,  intervalMs: 11000 } },
    description: 'Spawns a Lizardman every 11s.', deckCount: 1 },
  { name: 'Ballista Tower',rarity: 'rare',      cost: 3, cardType: 'structure',
    unit: { name: 'BallstaTwr',    attack: 0, maxHp: 20, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: BALLISTA_UNIT,   intervalMs: 15000 } },
    description: 'Spawns a Ballista every 15s.', deckCount: 1 },
  { name: 'Vamp. Coven',   rarity: 'rare',      cost: 3, cardType: 'structure',
    unit: { name: 'Vamp Coven',    attack: 0, maxHp: 20, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: VAMPIRE_UNIT,    intervalMs: 14000 } },
    description: 'Spawns a Vampire every 14s.', deckCount: 1 },
  { name: 'Aerie',         rarity: 'rare',      cost: 4, cardType: 'structure',
    unit: { name: 'Aerie',         attack: 0, maxHp: 28, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: GRIFFIN_UNIT,    intervalMs: 20000 } },
    description: 'Spawns a Griffin every 20s.', deckCount: 1 },
  { name: 'Mage Tower',    rarity: 'rare',      cost: 4, cardType: 'structure',
    unit: { name: 'Mage Tower',    attack: 0, maxHp: 22, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: FIRE_MAGE_UNIT,  intervalMs: 18000 } },
    description: 'Spawns a Fire Mage every 18s.', deckCount: 1 },
  { name: 'Gallows',       rarity: 'rare',      cost: 3, cardType: 'structure',
    unit: { name: 'Gallows',       attack: 0, maxHp: 18, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: EXECUTIONER_UNIT, intervalMs: 20000 } },
    description: 'Spawns an Executioner every 20s.', deckCount: 1 },
  { name: 'Mammoth Pen',   rarity: 'legendary', cost: 5, cardType: 'structure',
    unit: { name: 'Mammoth Pen',   attack: 0, maxHp: 35, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: MAMMOTH_UNIT,    intervalMs: 25000 } },
    description: 'Spawns a Mammoth every 25s.', deckCount: 1 },
  { name: 'Shadow Academy',rarity: 'rare',      cost: 3, cardType: 'structure',
    unit: { name: 'Shadow Acad',   attack: 0, maxHp: 20, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: DARK_ELF_UNIT,   intervalMs: 15000 } },
    description: 'Spawns a Dark Elf every 15s.', deckCount: 1 },
  { name: 'Death Tower',   rarity: 'rare',      cost: 4, cardType: 'structure',
    unit: { name: 'Death Tower',   attack: 0, maxHp: 22, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: NECROMANCER_UNIT, intervalMs: 18000 } },
    description: 'Spawns a Necromancer every 18s.', deckCount: 1 },
  { name: "Giant's Hall",  rarity: 'legendary', cost: 5, cardType: 'structure',
    unit: { name: "Giant's Hall",  attack: 0, maxHp: 40, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: GIANT_UNIT,      intervalMs: 45000 } },
    description: 'Spawns a Giant every 45s.', deckCount: 1 },
  { name: 'Wyvern Roost',  rarity: 'legendary', cost: 5, cardType: 'structure',
    unit: { name: 'Wyvern Roost',  attack: 0, maxHp: 35, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: WYVERN_UNIT,     intervalMs: 28000 } },
    description: 'Spawns a Wyvern every 28s.', deckCount: 1 },
  { name: 'Ancient Altar', rarity: 'legendary', cost: 6, cardType: 'structure',
    unit: { name: 'Anc. Altar',    attack: 0, maxHp: 50, isWall: false, bypassWall: false, moveSpeed: 0, attackRange: 0, attackCooldownMs: 0, structureEffect: { type: 'spawn', unitTemplate: BEHEMOTH_UNIT,   intervalMs: 70000 } },
    description: 'Spawns a Behemoth every 70s.', deckCount: 1 },

  // ══ BATCH 2: NEW UPGRADES ════════════════════════════════════════════════════
  { name: 'Field Medic',  rarity: 'common',    cost: 1, cardType: 'upgrade',
    upgradeEffect: { type: 'healUnits', amount: 6 }, description: 'Heal all your units for 6 HP.', deckCount: 2 },
  { name: 'Titan Blood',  rarity: 'rare',      cost: 3, cardType: 'upgrade',
    upgradeEffect: { type: 'buffMaxHp', amount: 20 }, description: 'All your units gain +20 max HP.', deckCount: 1 },
  { name: 'Sniper Scope', rarity: 'uncommon',  cost: 2, cardType: 'upgrade',
    upgradeEffect: { type: 'buffRange', amount: 30 }, description: 'All your units gain +30 attack range.', deckCount: 1 },
  { name: 'Battle Cry',   rarity: 'uncommon',  cost: 2, cardType: 'upgrade',
    upgradeEffect: { type: 'buffAttack', amount: 3 }, description: 'All your units gain +3 attack.', deckCount: 2 },
]

// ─── Hero Cards ───────────────────────────────────────────
// One hero is randomly injected into each player's deck per game.
// Heroes deploy a powerful unit AND immediately buff all friendly units.

export const HERO_CARDS: Card[] = [
  {
    id: 'hero-dragon-lord',
    name: 'Dragon Lord',
    rarity: 'legendary',
    cost: 5,
    cardType: 'unit',
    isHero: true,
    unit: { ...DRAGON_UNIT, attack: 15, maxHp: 50 },
    heroEffect: { type: 'buffAttack', amount: 6 },
    description: 'HERO: Deploys a mighty Dragon & grants all units +6 attack!',
  },
  {
    id: 'hero-battle-queen',
    name: 'Battle Queen',
    rarity: 'legendary',
    cost: 5,
    cardType: 'unit',
    isHero: true,
    unit: { ...PALADIN_UNIT, attack: 10, maxHp: 60 },
    heroEffect: { type: 'buffMaxHp', amount: 20 },
    description: 'HERO: Deploys an armored Paladin & fortifies all units with +20 max HP!',
  },
  {
    id: 'hero-storm-caller',
    name: 'Storm Caller',
    rarity: 'legendary',
    cost: 5,
    cardType: 'unit',
    isHero: true,
    unit: { ...WYVERN_UNIT, attack: 18, maxHp: 40 },
    heroEffect: { type: 'buffRange', amount: 40 },
    description: 'HERO: Deploys a fearsome Wyvern & blesses all units with +40 attack range!',
  },
  {
    id: 'hero-shadow-king',
    name: 'Shadow King',
    rarity: 'legendary',
    cost: 5,
    cardType: 'unit',
    isHero: true,
    unit: { ...WEREWOLF_UNIT, attack: 14, maxHp: 35 },
    heroEffect: { type: 'buffSpeed', amount: 25 },
    description: 'HERO: Deploys a savage Werewolf & surges all units with +25 speed!',
  },
]

// ─── Lore ─────────────────────────────────────────────────

const CARD_LORE: Record<string, string> = {
  // Units
  'Goblin':        'Once the cannon fodder of orc warbands, goblins discovered they actually enjoy being first through the door.',
  'Archer':        '"I don\'t miss." — Every archer, right before missing.',
  'Barbarian':     'Trained by no one, feared by everyone. Mostly feared because of the screaming.',
  'Knight':        "The kingdom's finest. Polished armour hides a spectacular collection of bruises.",
  'Wizard':        'Years of magical study. Thousands of gold in reagents. Wages still less than a goblin.',
  'Dragon':        'When it speaks, kingdoms listen. When it breathes, kingdoms burn.',
  'Skeleton':      'Died once, but keeps showing up. Very dedicated.',
  'Troll':         "You'll know it's coming. You'll have plenty of time to not do anything about it.",
  'Crossbow':      'A technically superior weapon. The operators will tell you at every opportunity.',
  'Paladin':       'Righteous, armoured, and absolutely insufferable at dinner.',
  'Rogue':         '"What wall?" — The Rogue, from the other side of the wall.',
  'Catapult':      'Technically pacifist. It\'s the rocks that do the violence.',
  'Werewolf':      'Formerly a reasonable accountant.',
  'Golem':         'Was told to hold the line. Has been holding it for two hundred years.',
  'Pixie':         'Shoots first, asks never.',
  'Ogre':          'Large. Loud. Effective. Not necessarily in that order.',
  'Plague Rat':    'One is an annoyance. A hundred is a catastrophe.',
  'Bandit':        'Honest work never paid this well.',
  'Bat':           'Hung upside down until called upon — a skill with surprising tactical applications.',
  'Scorpion':      'Armoured, venomous, grumpy. Triple threat.',
  'Shield Guard':  'Move? Why would I move?',
  'Centaur':       "The upper half writes poetry. The lower half doesn't know.",
  'Harpy':         'Sings beautifully. Fights savagely. Never at the same time.',
  'Specter':       'Died defending the post. Still defending it.',
  'Lizardman':     'Cold-blooded. Professionally and personally.',
  'Ballista':      '"Fire the ballista!" — said with far too much enthusiasm every time.',
  'Vampire':       'Charming until the biting starts. Sometimes also during the biting.',
  'Griffin':       'Half eagle, half lion, all opinion.',
  'Fire Mage':     'Extremely dangerous. Mostly to itself.',
  'Executioner':   'Does not like being told there is more than one swing allowed.',
  'Mammoth':       'Once a peaceful grazer. Someone put armour on it.',
  'Dark Elf':      'Watches from the shadows. Shoots from the shadows. Lives in the shadows. Hates dentist appointments.',
  'Necromancer':   'Death is just unemployment with extra steps.',
  'Giant':         'Slow. Inevitable. Cannot open doors, but rarely needs to.',
  'Wyvern':        "The dragon's practical cousin. Less fire, more punctuality.",
  'Behemoth':      'There is no plan B for a Behemoth. There is often no plan A left either.',
  // Structures
  'Build Wall':    'The first answer to every problem. Usually the second answer too.',
  'Build Farm':    'Food is mana. Mana is power. This farmer has no idea what he\'s contributing to.',
  'Barracks':      'Turns gold into goblins. Economists are still debating whether that\'s profitable.',
  'Arcane Tower':  'The archers it trains insist they learned everything naturally.',
  'Dragon Lair':   'Do not approach. Do not inquire. Absolutely do not ask about the rent.',
  'Crypt':         "Nobody asked what's in there. Everyone agrees not to.",
  'Troll Den':     'Smells terrible. Keeps the neighbours away.',
  'Garrison':      'A crossbow and a grudge, supplied on rotation.',
  'Cathedral':     'Blessed walls. Blessed warriors. Blessed inconvenient for the enemy.',
  'Rogue Den':     'No sign. No address. Impossible to miss.',
  'Siege Works':   'The engineers here have never met a wall they didn\'t want to destroy.',
  'Dark Shrine':   'Full moon schedule posted on the door.',
  'Iron Forge':    'Hammers day and night. Nobody sleeps within a mile.',
  'Fairy Ring':    '"Step inside the ring," they said. "It\'ll be fun," they said.',
  'Ogre Den':      'Listed as "residential" in the tax records.',
  'Rat Burrow':    'The smell announces them long before they arrive.',
  'Bandit Camp':   'Technically a business.',
  'Bat Cave':      'Dark inside. Dark outside. Mostly just dark.',
  'Scorpion Pit':  'HR has filed fourteen complaints about working conditions.',
  'Guard Post':    'Stand and deliver. Mostly stand.',
  'Centaur Stable':"It's not a stable, they keep insisting.",
  'Harpy Roost':   'Do not look up.',
  'Spirit Well':   'The water is fine. The spirits are not.',
  'Lizard Warren': 'Warm, underground, and excellent acoustics.',
  'Ballista Tower':'The elevator is broken. Engineers don\'t care.',
  'Vamp. Coven':   'Meets at midnight. Dress code: dramatic.',
  'Aerie':         'Spectacular view. Treacherous access. Worth it.',
  'Mage Tower':    'Full of books, experiments, and extremely anxious junior mages.',
  'Gallows':       'Structural integrity questionable. Attendance mandatory.',
  'Mammoth Pen':   'Do not feed after dark. Do not feed before dark either.',
  'Shadow Academy':'Curriculum: archery, shadows, and sighing at lesser beings.',
  'Death Tower':   'The door is unlocked. Nobody goes in uninvited.',
  "Giant's Hall":  'The ceiling keeps getting raised.',
  'Wyvern Roost':  'Perched atop the cliff where nothing else dares to live.',
  'Ancient Altar': 'Old beyond memory. Hungry beyond measure.',
  // Upgrades
  'Sharpen Blades':'The whetstone whine echoes across camp. Everyone quietly checks their grip.',
  'Fortify':       '"Walk it off." — Official battle doctrine.',
  'Rally':         'A rousing speech, a quick bandage — good as new.',
  'Haste':         'Legs moved so fast they filed a formal complaint.',
  'Iron Skin':     'Toughen up. Literally.',
  'Eagle Eye':     'See further. Regret it only slightly more often.',
  'War Drums':     'The rhythm of violence.',
  'Bloodlust':     'Faster. Angrier. Marginally more coordinated.',
  'Field Medic':   'Not a real medic. Effective anyway.',
  'Titan Blood':   'Thick. Extremely thick.',
  'Sniper Scope':  'For those who believe range is the solution to all problems.',
  'Battle Cry':    'Loud. Effective. No subtlety whatsoever.',
  // Heroes
  'Dragon Lord':   'Commands dragons. Dragons pretend not to notice.',
  'Battle Queen':  'Won sixteen wars. Lost zero negotiations.',
  'Storm Caller':  'The sky does what she says. Eventually.',
  'Shadow King':   'Feared in twelve kingdoms. Banned from two taverns specifically.',
}

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
    lore: CARD_LORE[def.name],
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
        lore: CARD_LORE[def.name],
      })
    }
  }
  return result
}

export function rarityStars(r: CardRarity): string {
  return '\u2605'.repeat({ common: 1, uncommon: 2, rare: 3, legendary: 4 }[r])
}
