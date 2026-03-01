// ─── Structure & Upgrade Effects ─────────────────────────

export type StructureEffect =
  | { type: 'mana'; amount: number }
  | { type: 'spawn'; unitTemplate: UnitTemplate; intervalMs: number }

export type UpgradeEffect =
  | { type: 'buffAttack'; amount: number }
  | { type: 'healUnits'; amount: number }

// ─── Cards ───────────────────────────────────────────────

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary'
export type CardType = 'unit' | 'structure' | 'upgrade'

export interface UnitTemplate {
  name: string
  attack: number
  maxHp: number
  isWall: boolean
  bypassWall: boolean
  moveSpeed: number          // pixels per second (0 = stationary structure)
  attackRange: number        // pixels — distance at which unit can attack
  attackCooldownMs: number   // ms between attacks
  structureEffect?: StructureEffect
}

export interface Unit extends UnitTemplate {
  id: string
  owner: 'player' | 'opponent'
  hp: number
  x: number                  // pixel position in the lane (0=player base, LANE_WIDTH=opponent base)
  attackTimer: number        // ms until this unit can attack again
  spawnTimer?: number        // ms until next spawn (spawner buildings only)
}

export interface Card {
  id: string
  name: string
  rarity: CardRarity
  cost: number
  cardType: CardType
  unit?: UnitTemplate
  upgradeEffect?: UpgradeEffect
  description: string
}

// ─── Game ────────────────────────────────────────────────

export interface Base {
  hp: number
  maxHp: number
}

export type GamePhase =
  | { type: 'playing' }
  | { type: 'gameOver'; winner: 'player' | 'opponent' | 'draw' }

export const LANE_WIDTH = 500

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
  manaAccum: number          // fractional mana toward next point (0–1)
  cardCooldown: number       // ms until player can play another card
  log: string[]
  phase: GamePhase
  opponentTimer: number      // ms until opponent next acts
  gameTime: number           // total elapsed game time in ms
  playerScore: number        // cumulative damage dealt to opponent
  opponentScore: number      // cumulative damage dealt to player
  suddenDeath: boolean       // true once all cards exhausted
  suddenDeathTimer: number   // ms remaining in sudden death (60 000 at start)
}
