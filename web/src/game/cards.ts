import { Card, CardRarity, CardType, UnitTemplate, UpgradeEffect } from './types'

let _id = 0
const uid = () => `card-${++_id}`

interface UnitCardDef {
  count: number
  name: string
  rarity: CardRarity
  cost: number
  unit: UnitTemplate
  description: string
}

interface UpgradeCardDef {
  count: number
  name: string
  rarity: CardRarity
  cost: number
  upgradeEffect: UpgradeEffect
  description: string
}

function makeUnits(def: UnitCardDef, cardType: CardType = 'unit'): Card[] {
  return Array.from({ length: def.count }, () => ({
    id: uid(),
    name: def.name,
    rarity: def.rarity,
    cost: def.cost,
    cardType,
    unit: def.unit,
    description: def.description,
  }))
}

function makeUpgrades(def: UpgradeCardDef): Card[] {
  return Array.from({ length: def.count }, () => ({
    id: uid(),
    name: def.name,
    rarity: def.rarity,
    cost: def.cost,
    cardType: 'upgrade' as CardType,
    upgradeEffect: def.upgradeEffect,
    description: def.description,
  }))
}

// Shared unit templates for spawner buildings
const GOBLIN_UNIT: UnitTemplate = {
  name: 'Goblin', attack: 3, maxHp: 10, isWall: false, bypassWall: false,
  moveSpeed: 45, attackRange: 5, attackCooldownMs: 1000,
}
const ARCHER_UNIT: UnitTemplate = {
  name: 'Archer', attack: 3, maxHp: 8, isWall: false, bypassWall: true,
  moveSpeed: 28, attackRange: 80, attackCooldownMs: 1500,
}
const DRAGON_UNIT: UnitTemplate = {
  name: 'Dragon', attack: 10, maxHp: 30, isWall: false, bypassWall: true,
  moveSpeed: 18, attackRange: 50, attackCooldownMs: 3000,
}

export function makeDeck(): Card[] {
  return [
    // ── Units ──────────────────────────────────────────────
    ...makeUnits({
      count: 3, name: 'Goblin', rarity: 'common', cost: 1,
      unit: GOBLIN_UNIT,
      description: 'Fast melee fighter.',
    }),
    ...makeUnits({
      count: 3, name: 'Archer', rarity: 'common', cost: 1,
      unit: ARCHER_UNIT,
      description: 'Ranged — fires over walls.',
    }),
    ...makeUnits({
      count: 3, name: 'Barbarian', rarity: 'uncommon', cost: 2,
      unit: {
        name: 'Barbarian', attack: 7, maxHp: 15, isWall: false, bypassWall: false,
        moveSpeed: 35, attackRange: 5, attackCooldownMs: 1800,
      },
      description: 'Hard-hitting melee fighter.',
    }),
    ...makeUnits({
      count: 3, name: 'Knight', rarity: 'uncommon', cost: 2,
      unit: {
        name: 'Knight', attack: 4, maxHp: 25, isWall: false, bypassWall: false,
        moveSpeed: 22, attackRange: 5, attackCooldownMs: 1500,
      },
      description: 'Armored frontline tank.',
    }),
    ...makeUnits({
      count: 2, name: 'Wizard', rarity: 'rare', cost: 3,
      unit: {
        name: 'Wizard', attack: 6, maxHp: 10, isWall: false, bypassWall: true,
        moveSpeed: 22, attackRange: 70, attackCooldownMs: 2000,
      },
      description: 'Magic bypasses walls.',
    }),
    ...makeUnits({
      count: 1, name: 'Dragon', rarity: 'legendary', cost: 4,
      unit: DRAGON_UNIT,
      description: 'Unstoppable aerial might.',
    }),
    // ── Structures ─────────────────────────────────────────
    ...makeUnits({
      count: 3, name: 'Build Wall', rarity: 'common', cost: 1,
      unit: {
        name: 'Wall', attack: 0, maxHp: 40, isWall: true, bypassWall: false,
        moveSpeed: 0, attackRange: 0, attackCooldownMs: 0,
      },
      description: 'Blocks melee units.',
    }, 'structure'),
    ...makeUnits({
      count: 2, name: 'Build Farm', rarity: 'uncommon', cost: 2,
      unit: {
        name: 'Farm', attack: 0, maxHp: 20, isWall: false, bypassWall: false,
        moveSpeed: 0, attackRange: 0, attackCooldownMs: 0,
        structureEffect: { type: 'mana', amount: 1 },
      },
      description: '+1 max mana while standing.',
    }, 'structure'),
    // Barracks — spawns a Goblin every 8 s
    ...makeUnits({
      count: 2, name: 'Barracks', rarity: 'uncommon', cost: 2,
      unit: {
        name: 'Barracks', attack: 0, maxHp: 25, isWall: false, bypassWall: false,
        moveSpeed: 0, attackRange: 0, attackCooldownMs: 0,
        structureEffect: { type: 'spawn', unitTemplate: GOBLIN_UNIT, intervalMs: 8000 },
      },
      description: 'Spawns a Goblin every 8s.',
    }, 'structure'),
    // Arcane Tower — spawns an Archer every 12 s
    ...makeUnits({
      count: 1, name: 'Arcane Tower', rarity: 'rare', cost: 3,
      unit: {
        name: 'Arc.Tower', attack: 0, maxHp: 20, isWall: false, bypassWall: false,
        moveSpeed: 0, attackRange: 0, attackCooldownMs: 0,
        structureEffect: { type: 'spawn', unitTemplate: ARCHER_UNIT, intervalMs: 12000 },
      },
      description: 'Spawns an Archer every 12s.',
    }, 'structure'),
    // Dragon Lair — spawns a Dragon every 25 s
    ...makeUnits({
      count: 1, name: 'Dragon Lair', rarity: 'legendary', cost: 5,
      unit: {
        name: 'DrgnLair', attack: 0, maxHp: 30, isWall: false, bypassWall: false,
        moveSpeed: 0, attackRange: 0, attackCooldownMs: 0,
        structureEffect: { type: 'spawn', unitTemplate: DRAGON_UNIT, intervalMs: 25000 },
      },
      description: 'Spawns a Dragon every 25s.',
    }, 'structure'),
    // ── Upgrades ───────────────────────────────────────────
    ...makeUpgrades({
      count: 2, name: 'Sharpen Blades', rarity: 'uncommon', cost: 2,
      upgradeEffect: { type: 'buffAttack', amount: 2 },
      description: 'All your units gain +2 attack.',
    }),
    ...makeUpgrades({
      count: 1, name: 'Fortify', rarity: 'rare', cost: 2,
      upgradeEffect: { type: 'healUnits', amount: 8 },
      description: 'Heal all your units for 8 HP.',
    }),
  ]
}

export function rarityStars(r: CardRarity): string {
  return '\u2605'.repeat({ common: 1, uncommon: 2, rare: 3, legendary: 4 }[r])
}
