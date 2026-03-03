export type RareEventKind =
  | 'blackjack'
  | 'fakeCrash'
  | 'wrongNumber'
  | 'narrator'
  | 'liarsDice'

export interface RareEventEffect {
  damage?:          number   // damage dealt to opponent base
  selfDamage?:      number   // damage dealt to player base
  crystals?:        number   // crystals gained (positive) or lost (negative)
  killEnemyUnits?:  number   // remove N random mobile enemy units from the field
  logMessage?:      string   // message appended to the battle log
}

export const RARE_EVENT_CHANCE = 0.001  // 1 in 1000 games

export const ALL_RARE_EVENTS: RareEventKind[] = [
  'blackjack',
  'fakeCrash',
  'wrongNumber',
  'narrator',
  'liarsDice',
]
