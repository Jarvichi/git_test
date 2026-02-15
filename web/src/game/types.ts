// ─── Card Effects (extensible) ───────────────────────────

export type CardEffect =
  | { type: 'moveSteps'; value: number }
  | { type: 'jumpToNextReward' }
  | { type: 'dealDamage'; value: number }
  | { type: 'healHP'; value: number }
  | { type: 'block'; value: number }

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface Card {
  id: string
  name: string
  rarity: CardRarity
  sideA: CardEffect   // typically movement
  sideB: CardEffect   // typically combat
}

// ─── Path ────────────────────────────────────────────────

export type SpaceType = 'start' | 'battle' | 'reward' | 'boss'

export interface PathNode {
  id: string
  step: number        // 0 = start, 1-9 = path, 10 = boss
  branchIndex: number // 0, 1, or 2
  spaceType: SpaceType
  isVisited: boolean
  childIds: string[]
}

// ─── Battle ──────────────────────────────────────────────

export interface BattleState {
  enemyName: string
  enemyHP: number
  enemyMaxHP: number
  enemyDamagePerTurn: number
  playerBlockThisTurn: number
  log: string[]
  isResolved: boolean
}

// ─── Game Phase ──────────────────────────────────────────

export type GamePhase =
  | { type: 'movement' }
  | { type: 'battle' }
  | { type: 'reward' }
  | { type: 'battleReward' }
  | { type: 'bossFight' }
  | { type: 'gameOver'; won: boolean }

// ─── Game State ──────────────────────────────────────────

export interface GameState {
  allNodes: PathNode[]
  currentNodeId: string

  hand: Card[]
  drawPile: Card[]
  discardPile: Card[]
  rewardChoices: Card[]

  playerHP: number
  playerMaxHP: number

  phase: GamePhase
  activeBattle: BattleState | null

  currentStep: number
  turnNumber: number
  message: string
}
