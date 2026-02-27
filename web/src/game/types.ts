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
  structureEffect?: StructureEffect
}

export interface Unit extends UnitTemplate {
  id: string
  owner: 'player' | 'opponent'
  hp: number
  spawnTimer?: number      // ms until next spawn (spawner buildings only)
  isNew?: boolean          // triggers enter animation on first render
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
  deployMs?: number        // override default deploy time
}

// ─── Queue ────────────────────────────────────────────────

export interface QueuedCard {
  qId: string
  card: Card
  msRemaining: number
  totalMs: number
}

// ─── Game ────────────────────────────────────────────────

export interface Base {
  hp: number
  maxHp: number
}

export type GamePhase =
  | { type: 'playing' }
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
  manaAccum: number       // fractional mana toward next point (0–1)
  queue: QueuedCard[]     // player's deploy queue
  log: string[]
  phase: GamePhase
  combatTimer: number     // ms until next auto-combat
  opponentTimer: number   // ms until opponent next acts
  turn: number            // combat round counter
}
