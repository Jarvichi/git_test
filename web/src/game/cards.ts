import { Card, CardEffect, CardRarity } from './types'

let nextId = 0
function uid(): string {
  return `card-${++nextId}`
}

function makeCards(
  count: number,
  name: string,
  rarity: CardRarity,
  sideA: CardEffect,
  sideB: CardEffect,
): Card[] {
  return Array.from({ length: count }, () => ({
    id: uid(),
    name,
    rarity,
    sideA,
    sideB,
  }))
}

export function makeDeck(): Card[] {
  return [
    ...makeCards(5, 'Weak Strike',    'common',    { type: 'moveSteps', value: 1 }, { type: 'dealDamage', value: 3 }),
    ...makeCards(4, 'Quick Blade',    'common',    { type: 'moveSteps', value: 2 }, { type: 'dealDamage', value: 5 }),
    ...makeCards(3, 'Swift Healer',   'uncommon',  { type: 'moveSteps', value: 3 }, { type: 'healHP', value: 4 }),
    ...makeCards(3, 'Shield Creep',   'uncommon',  { type: 'moveSteps', value: 1 }, { type: 'block', value: 4 }),
    ...makeCards(2, 'Vaulter',        'rare',      { type: 'jumpToNextReward' },    { type: 'dealDamage', value: 8 }),
    ...makeCards(2, 'Mend Runner',    'rare',      { type: 'moveSteps', value: 2 }, { type: 'healHP', value: 6 }),
    ...makeCards(1, "Legend's Charge", 'legendary', { type: 'moveSteps', value: 4 }, { type: 'dealDamage', value: 12 }),
  ]
}

export function effectDescription(e: CardEffect): string {
  switch (e.type) {
    case 'moveSteps':      return `Move ${e.value}`
    case 'jumpToNextReward': return 'Jump→Rwd'
    case 'dealDamage':     return `Deal ${e.value}dmg`
    case 'healHP':         return `Heal ${e.value}HP`
    case 'block':          return `Block ${e.value}`
  }
}

export function effectLabel(e: CardEffect): string {
  switch (e.type) {
    case 'moveSteps':
    case 'jumpToNextReward': return 'MOV'
    case 'dealDamage':       return 'ATK'
    case 'healHP':           return 'HEL'
    case 'block':            return 'DEF'
  }
}

export function rarityStars(r: CardRarity): string {
  switch (r) {
    case 'common':    return '★'
    case 'uncommon':  return '★★'
    case 'rare':      return '★★★'
    case 'legendary': return '★★★★'
  }
}
