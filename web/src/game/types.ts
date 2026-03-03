// ─── Structure & Upgrade Effects ─────────────────────────

export type StructureEffect =
  | { type: 'mana'; amount: number }
  | { type: 'spawn'; unitTemplate: UnitTemplate; intervalMs: number }

export type UpgradeEffect =
  | { type: 'buffAttack'; amount: number }
  | { type: 'healUnits';  amount: number }
  | { type: 'buffSpeed';  amount: number }   // adds to moveSpeed of all mobile units
  | { type: 'buffMaxHp';  amount: number }   // increases maxHp and heals by same amount
  | { type: 'buffRange';  amount: number }   // increases attackRange of all attacking units

// ─── Cards ───────────────────────────────────────────────

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary'
export type CardType = 'unit' | 'structure' | 'upgrade'

export interface UnitTemplate {
  name: string
  attack: number
  maxHp: number
  isWall: boolean
  /** True if this unit skips walls when choosing attack targets (ranged / magic). */
  bypassWall: boolean
  /** True if this unit physically flies over walls — never stopped by them. */
  flying?: boolean
  /** True if this unit can scale walls — passes through at 25 % speed instead of stopping. */
  climber?: boolean
  moveSpeed: number          // pixels per second (0 = stationary structure)
  attackRange: number        // pixels — distance at which unit can attack
  attackCooldownMs: number   // ms between attacks
  structureEffect?: StructureEffect
}

export interface Unit extends UnitTemplate {
  id: string
  owner: 'player' | 'opponent'
  hp: number
  x: number                  // forward axis: 0=player base, LANE_WIDTH=opponent base
  y: number                  // lateral axis: one of [-80,-40,0,40,80] (5 lanes, continuous during movement)
  attackTimer: number        // ms until this unit can attack again
  spawnTimer?: number        // ms until next spawn (spawner buildings only)
  upgradeLevel?: number      // 1 = base, 2+ = upgraded (structures only)
  spawnGrowTimer?: number    // ms remaining in grow-in animation (building spawns only)
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
  lore?: string              // flavour text shown in the card detail view
  isHero?: boolean           // hero cards deploy a unit AND trigger a heroEffect buff
  heroEffect?: UpgradeEffect // the permanent buff applied to all friendly units when played
}

// ─── Battle Events ────────────────────────────────────────

export type BattleEventType = 'bloodMoon' | 'fogOfWar' | 'supplyDrop' | 'earthquake'

export interface BattleEventState {
  type: BattleEventType
  label: string
  remainingMs: number        // duration; instant events use ~3000 just for banner display
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

export type OpponentStrategy = 'swarm' | 'turtle' | 'rush'

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
  log: string[]
  phase: GamePhase
  opponentTimer: number      // ms until opponent next acts
  opponentStrategy: OpponentStrategy
  gameTime: number           // total elapsed game time in ms
  playerScore: number        // cumulative damage dealt to opponent
  opponentScore: number      // cumulative damage dealt to player
  suddenDeath: boolean       // true once all cards exhausted
  suddenDeathTimer: number   // ms remaining in sudden death (60 000 at start)
  battleEventTimer: number   // ms until next battle event fires
  activeBattleEvent: BattleEventState | null
}
