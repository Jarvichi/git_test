// ─── Structure & Upgrade Effects ─────────────────────────

export type StructureEffect =
  | { type: 'mana'; amount: number }      // +N max mana per turn while alive
  | { type: 'extraDraw'; amount: number } // draw N extra cards per turn while alive

export type UpgradeEffect =
  | { type: 'buffAttack'; amount: number } // +N attack to all friendly units
  | { type: 'healUnits'; amount: number }  // heal all friendly units N HP

// ─── Cards ───────────────────────────────────────────────

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary'
export type CardType = 'unit' | 'structure' | 'upgrade'

export interface UnitTemplate {
  name: string
  attack: number
  maxHp: number
  isWall: boolean      // absorbs melee attacks before other units
  bypassWall: boolean  // ignores walls when selecting targets
  structureEffect?: StructureEffect
}

export interface Unit extends UnitTemplate {
  id: string
  owner: 'player' | 'opponent'
  hp: number
}

export interface Card {
  id: string
  name: string
  rarity: CardRarity
  cost: number
  cardType: CardType
  unit?: UnitTemplate          // unit and structure cards
  upgradeEffect?: UpgradeEffect // upgrade cards
  description: string
}

// ─── Game ────────────────────────────────────────────────

export interface Base {
  hp: number
  maxHp: number
}

export type GamePhase =
  | { type: 'playerTurn' }
  | { type: 'gameOver'; winner: 'player' | 'opponent' }

export interface GameState {
  playerBase: Base
  opponentBase: Base
  field: Unit[]
  playerHand: Card[]
  playerDeck: Card[]
  opponentHand: Card[]
  opponentDeck: Card[]
  mana: number
  maxMana: number
  log: string[]
  phase: GamePhase
  turn: number
}
