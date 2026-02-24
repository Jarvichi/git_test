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

export function makeDeck(): Card[] {
  return [
    // ── Units ──────────────────────────────────────────────
    ...makeUnits({
      count: 3, name: 'Goblin', rarity: 'common', cost: 1,
      unit: { name: 'Goblin', attack: 2, maxHp: 3, isWall: false, bypassWall: false },
      description: 'Cheap melee fighter.',
    }),
    ...makeUnits({
      count: 3, name: 'Archer', rarity: 'common', cost: 1,
      unit: { name: 'Archer', attack: 2, maxHp: 3, isWall: false, bypassWall: true },
      description: 'Ranged — fires over walls.',
    }),
    ...makeUnits({
      count: 3, name: 'Barbarian', rarity: 'uncommon', cost: 2,
      unit: { name: 'Barbarian', attack: 4, maxHp: 4, isWall: false, bypassWall: false },
      description: 'Hard-hitting melee fighter.',
    }),
    ...makeUnits({
      count: 3, name: 'Knight', rarity: 'uncommon', cost: 2,
      unit: { name: 'Knight', attack: 3, maxHp: 7, isWall: false, bypassWall: false },
      description: 'Armored frontline tank.',
    }),
    ...makeUnits({
      count: 2, name: 'Wizard', rarity: 'rare', cost: 3,
      unit: { name: 'Wizard', attack: 5, maxHp: 3, isWall: false, bypassWall: true },
      description: 'Magic bypasses walls.',
    }),
    ...makeUnits({
      count: 1, name: 'Dragon', rarity: 'legendary', cost: 4,
      unit: { name: 'Dragon', attack: 8, maxHp: 7, isWall: false, bypassWall: true },
      description: 'Unstoppable aerial might.',
    }),
    // ── Structures ─────────────────────────────────────────
    ...makeUnits({
      count: 3, name: 'Build Wall', rarity: 'common', cost: 1,
      unit: { name: 'Wall', attack: 0, maxHp: 10, isWall: true, bypassWall: false },
      description: 'Absorbs melee attacks first.',
    }, 'structure'),
    ...makeUnits({
      count: 2, name: 'Build Farm', rarity: 'uncommon', cost: 2,
      unit: {
        name: 'Farm', attack: 0, maxHp: 6, isWall: false, bypassWall: false,
        structureEffect: { type: 'mana', amount: 1 },
      },
      description: '+1 max mana per turn while standing.',
    }, 'structure'),
    ...makeUnits({
      count: 1, name: 'Build Barracks', rarity: 'rare', cost: 3,
      unit: {
        name: 'Barracks', attack: 0, maxHp: 8, isWall: false, bypassWall: false,
        structureEffect: { type: 'extraDraw', amount: 1 },
      },
      description: 'Draw +1 card at the start of each turn.',
    }, 'structure'),
    // ── Upgrades ───────────────────────────────────────────
    ...makeUpgrades({
      count: 2, name: 'Sharpen Blades', rarity: 'uncommon', cost: 2,
      upgradeEffect: { type: 'buffAttack', amount: 2 },
      description: 'All your units gain +2 attack.',
    }),
    ...makeUpgrades({
      count: 1, name: 'Fortify', rarity: 'rare', cost: 2,
      upgradeEffect: { type: 'healUnits', amount: 4 },
      description: 'Heal all your units for 4 HP.',
    }),
  ]
}

export function rarityStars(r: CardRarity): string {
  return '★'.repeat({ common: 1, uncommon: 2, rare: 3, legendary: 4 }[r])
}
