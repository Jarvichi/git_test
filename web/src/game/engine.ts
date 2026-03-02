import { GameState, Card, Unit, UnitTemplate, UpgradeEffect, LANE_WIDTH } from './types'
import { makeDeck } from './cards'

// ─── Constants ────────────────────────────────────────────

const OPPONENT_INTERVAL_MS = 8000
const MANA_REGEN_MS = 3000       // 1 mana every 3 seconds
const BASE_MAX_MANA = 5
export const CARD_COOLDOWN_MS = 5000  // 5 s between card plays
const SUDDEN_DEATH_MS = 60000

const PLAYER_SPAWN_X = 30        // where player units appear
const OPPONENT_SPAWN_X = LANE_WIDTH - 30  // where opponent units appear

// ─── Helpers ─────────────────────────────────────────────

let _unitId = 0
function uid(): string { return `unit-${++_unitId}` }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function drawCard(deck: Card[], hand: Card[]): void {
  if (deck.length > 0) hand.push(deck.shift()!)
}

// Five lanes evenly spread across the battle-field's lateral (Y) axis.
// Y=0 is centre; units move continuously between these positions.
const LANE_POSITIONS = [-80, -40, 0, 40, 80] as const
const LANE_MIN_Y = -80
const LANE_MAX_Y =  80

function spawnUnit(template: UnitTemplate, owner: 'player' | 'opponent'): Unit {
  const unit: Unit = {
    ...template,
    id: uid(),
    owner,
    hp: template.maxHp,
    x: owner === 'player' ? PLAYER_SPAWN_X : OPPONENT_SPAWN_X,
    y: 0,
    attackTimer: 0,
  }
  if (template.structureEffect?.type === 'spawn') {
    unit.spawnTimer = template.structureEffect.intervalMs
  }
  // Structures stay at base; walls are placed further out to form a defensive line
  if (template.moveSpeed === 0) {
    unit.x = template.isWall
      ? (owner === 'player' ? 150 : LANE_WIDTH - 150)
      : (owner === 'player' ? 10 : LANE_WIDTH - 10)
    unit.upgradeLevel = 1
  } else {
    // Mobile units spawn in a random lane
    unit.y = LANE_POSITIONS[Math.floor(Math.random() * LANE_POSITIONS.length)]
  }
  return unit
}

// ─── Mana bonus from Farms ────────────────────────────────

function getManaBonus(field: Unit[], owner: 'player' | 'opponent'): number {
  return field
    .filter(u => u.owner === owner && u.structureEffect?.type === 'mana')
    .reduce((sum, u) => sum + (u.structureEffect as { type: 'mana'; amount: number }).amount, 0)
}

// ─── New Game ────────────────────────────────────────────

export const MAX_HANDICAP = 20

/**
 * Start a new game.
 * @param playerCards  Optional custom deck for the player (defaults to makeDeck()).
 * @param opponentHandicap  Cards removed from the opponent's deck (adaptive difficulty).
 *   Increases by 1 on each player loss, decreases by 1 on each win (floor 0).
 */
export function newGame(playerCards?: Card[], opponentHandicap = 0): GameState {
  const playerDeck = shuffle(playerCards ?? makeDeck())
  const rawOpponentDeck = shuffle(makeDeck())
  // Remove cards from the tail of the shuffled deck to weaken the opponent
  const clamp = Math.min(Math.max(0, opponentHandicap), MAX_HANDICAP)
  const opponentDeck = rawOpponentDeck.slice(0, Math.max(4, rawOpponentDeck.length - clamp))
  const playerHand = playerDeck.splice(0, 4)
  const opponentHand = opponentDeck.splice(0, 4)

  return {
    playerBase: { hp: 50, maxHp: 50 },
    opponentBase: { hp: 50, maxHp: 50 },
    field: [],
    playerHand,
    playerDeck,
    opponentHand,
    opponentDeck,
    mana: 3,
    maxMana: BASE_MAX_MANA,
    manaAccum: 0,
    cardCooldown: 0,
    log: [
      clamp > 0
        ? `Battle begins! (Enemy -${clamp} card${clamp !== 1 ? 's' : ''} handicap)`
        : 'Battle begins! Tap cards to deploy.',
    ],
    phase: { type: 'playing' },
    opponentTimer: OPPONENT_INTERVAL_MS,
    gameTime: 0,
    playerScore: 0,
    opponentScore: 0,
    suddenDeath: false,
    suddenDeathTimer: 0,
  }
}

// ─── Play Card (immediate deploy + cooldown) ─────────────

export function playCard(state: GameState, cardId: string): GameState {
  if (state.phase.type !== 'playing') return state
  if (state.cardCooldown > 0) return state

  const cardIdx = state.playerHand.findIndex(c => c.id === cardId)
  if (cardIdx === -1) return state

  const card = state.playerHand[cardIdx]
  if (state.mana < card.cost) return state

  const s = structuredClone(state)
  s.playerHand.splice(cardIdx, 1)
  s.mana -= card.cost
  s.cardCooldown = CARD_COOLDOWN_MS

  deployCard(s, card, 'player', s.log)
  drawCard(s.playerDeck, s.playerHand)
  return s
}

// ─── Apply Upgrade ────────────────────────────────────────

function applyUpgrade(s: GameState, effect: UpgradeEffect, owner: 'player' | 'opponent', log: string[]): void {
  const units = s.field.filter(u => u.owner === owner)
  const label = owner === 'player' ? 'Your' : 'Enemy'
  if (effect.type === 'buffAttack') {
    for (const u of units) u.attack += effect.amount
    log.push(`${label} units gain +${effect.amount} attack!`)
  } else if (effect.type === 'healUnits') {
    for (const u of units) u.hp = Math.min(u.maxHp, u.hp + effect.amount)
    log.push(`${label} units healed ${effect.amount} HP.`)
  } else if (effect.type === 'buffSpeed') {
    for (const u of units) if (u.moveSpeed > 0) u.moveSpeed += effect.amount
    log.push(`${label} units surge +${effect.amount} speed!`)
  } else if (effect.type === 'buffMaxHp') {
    for (const u of units) { u.maxHp += effect.amount; u.hp = Math.min(u.hp + effect.amount, u.maxHp) }
    log.push(`${label} units gain +${effect.amount} max HP!`)
  } else if (effect.type === 'buffRange') {
    for (const u of units) if (u.attackRange > 0) u.attackRange += effect.amount
    log.push(`${label} units gain +${effect.amount} attack range!`)
  }
}

// ─── Deploy a card onto the field ────────────────────────

function deployCard(s: GameState, card: Card, owner: 'player' | 'opponent', log: string[]): void {
  if (card.cardType === 'unit' || card.cardType === 'structure') {
    // If playing a structure and one of the same type already exists, upgrade it instead
    if (card.cardType === 'structure') {
      const template = card.unit!
      const existing = s.field.find(u => u.owner === owner && u.name === template.name)
      if (existing) {
        existing.maxHp *= 2
        existing.hp = Math.min(existing.hp * 2, existing.maxHp)
        existing.upgradeLevel = (existing.upgradeLevel ?? 1) + 1
        let note = 'HP×2'
        if (existing.structureEffect?.type === 'spawn') {
          const spawnEffect = existing.structureEffect as { type: 'spawn'; unitTemplate: UnitTemplate; intervalMs: number }
          spawnEffect.intervalMs = Math.max(3000, Math.floor(spawnEffect.intervalMs / 2))
          if (existing.spawnTimer != null) {
            existing.spawnTimer = Math.min(existing.spawnTimer, spawnEffect.intervalMs)
          }
          note += ', spawn×2'
        }
        const who = owner === 'player' ? 'You' : 'Opponent'
        log.push(`${who} upgraded ${existing.name}! (${note})`)
        return
      }
    }
    const unit = spawnUnit(card.unit!, owner)
    s.field.push(unit)
    const verb = card.cardType === 'structure' ? 'built' : 'deployed'
    const who = owner === 'player' ? 'You' : 'Opponent'
    log.push(`${who} ${verb} ${unit.name}.`)
  } else if (card.cardType === 'upgrade' && card.upgradeEffect) {
    applyUpgrade(s, card.upgradeEffect, owner, log)
  }
}

// ─── Distance helpers ─────────────────────────────────────

/**
 * Effective gameplay distance between two units.
 * Walls span the full lateral axis, so only the forward (X) gap matters for
 * them. All other units use true 2-D Euclidean distance so that units in
 * different lanes must physically close the gap before attacking.
 */
function unitDist(a: Unit, b: Unit): number {
  if (b.isWall) return Math.abs(a.x - b.x)
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

// ─── Enemy-finding helpers ────────────────────────────────

// Nearest enemy that is AHEAD (forward X) of this unit.
// flying/climber units ignore walls entirely.
function findNearestEnemy(field: Unit[], unit: Unit): Unit | null {
  let nearest: Unit | null = null
  let nearestDist = Infinity

  for (const other of field) {
    if (other.owner === unit.owner || other.hp <= 0) continue
    if (other.isWall && (unit.flying || unit.climber)) continue
    // "Ahead" is still defined on the X axis (direction toward enemy base)
    if (unit.owner === 'player'   && other.x < unit.x) continue
    if (unit.owner === 'opponent' && other.x > unit.x) continue

    const d = unitDist(unit, other)
    if (d < nearestDist) { nearestDist = d; nearest = other }
  }
  return nearest
}

// Nearest enemy that has slipped BEHIND this unit — used to turn around.
function findEnemyBehind(field: Unit[], unit: Unit): Unit | null {
  let nearest: Unit | null = null
  let nearestDist = Infinity

  for (const other of field) {
    if (other.owner === unit.owner || other.hp <= 0) continue
    if (other.isWall && (unit.flying || unit.climber)) continue
    if (unit.owner === 'player'   && other.x >= unit.x) continue
    if (unit.owner === 'opponent' && other.x <= unit.x) continue

    const d = unitDist(unit, other)
    if (d < nearestDist) { nearestDist = d; nearest = other }
  }
  return nearest
}

// Nearest enemy within attack range (2-D). bypassWall/climber units skip walls.
function findAttackTarget(field: Unit[], unit: Unit): Unit | null {
  let nearest: Unit | null = null
  let nearestDist = Infinity

  for (const other of field) {
    if (other.owner === unit.owner || other.hp <= 0) continue
    if (other.isWall && (unit.bypassWall || unit.climber)) continue

    const d = unitDist(unit, other)
    if (d > unit.attackRange) continue
    if (d < nearestDist) { nearestDist = d; nearest = other }
  }
  return nearest
}

// ─── Movement ─────────────────────────────────────────────

const CLIMB_SPEED_FACTOR = 0.25   // climbers move at 25 % speed through wall zones
const WALL_CLIMB_ZONE   = 30      // px radius around a wall that counts as "wall zone"

function moveUnits(s: GameState, deltaMs: number): void {
  const deltaSec = deltaMs / 1000

  for (const unit of s.field) {
    if (unit.moveSpeed === 0) continue

    const nearestAhead = findNearestEnemy(s.field, unit)

    // Determine movement target and vector
    // Default: march straight toward the enemy base in current lane
    let tx: number = unit.owner === 'player' ? LANE_WIDTH : 0
    let ty: number = unit.y
    let hasTarget = false

    if (nearestAhead) {
      // If already in attack range, stand still
      if (unitDist(unit, nearestAhead) <= unit.attackRange) continue
      tx = nearestAhead.x
      // Walls span the whole lateral axis — approach straight ahead; don't drift Y
      ty = nearestAhead.isWall ? unit.y : nearestAhead.y
      hasTarget = true
    } else {
      // No enemies ahead — check if one slipped behind us
      const behind = findEnemyBehind(s.field, unit)
      if (behind) {
        if (unitDist(unit, behind) <= unit.attackRange) continue
        tx = behind.x
        ty = behind.isWall ? unit.y : behind.y
        hasTarget = true
      }
    }

    // tx/ty already default to "march toward base" — hasTarget just flags
    // whether we already assigned a real target above
    void hasTarget

    const dx = tx - unit.x
    const dy = ty - unit.y
    const d  = Math.sqrt(dx * dx + dy * dy)
    if (d === 0) continue

    // Climbers slow down when passing through an enemy wall zone
    const inWallZone = unit.climber && s.field.some(w =>
      w.isWall && w.owner !== unit.owner && w.hp > 0 &&
      Math.abs(unit.x - w.x) <= WALL_CLIMB_ZONE
    )
    const speed = (inWallZone ? unit.moveSpeed * CLIMB_SPEED_FACTOR : unit.moveSpeed) * deltaSec

    // Move at full speed toward target, clamped so we don't overshoot
    const step = Math.min(speed, d)
    unit.x = Math.min(LANE_WIDTH, Math.max(0,         unit.x + (dx / d) * step))
    unit.y = Math.min(LANE_MAX_Y, Math.max(LANE_MIN_Y, unit.y + (dy / d) * step))
  }
}

// ─── Per-unit Combat ──────────────────────────────────────

function processAttacks(s: GameState, deltaMs: number, log: string[]): void {
  for (const unit of s.field) {
    if (unit.attack === 0 || unit.hp <= 0) continue

    if (unit.attackTimer > 0) {
      unit.attackTimer -= deltaMs
      continue
    }

    const target = findAttackTarget(s.field, unit)
    const isPlayer = unit.owner === 'player'

    if (target) {
      const prevHp = target.hp
      target.hp -= unit.attack
      const actualDamage = prevHp - Math.max(0, target.hp)
      if (isPlayer) s.playerScore += actualDamage
      else s.opponentScore += actualDamage
      unit.attackTimer = unit.attackCooldownMs
      if (target.hp <= 0) {
        log.push(`${unit.name} destroyed ${target.name}!`)
      }
    } else {
      // No enemies in range — attack the base if close enough
      const atEnemyBase = isPlayer
        ? unit.x >= LANE_WIDTH - unit.attackRange
        : unit.x <= unit.attackRange

      if (atEnemyBase) {
        if (isPlayer) {
          const prev = s.opponentBase.hp
          s.opponentBase.hp = Math.max(0, s.opponentBase.hp - unit.attack)
          s.playerScore += prev - s.opponentBase.hp
          log.push(`${unit.name} hits Enemy Base! -${unit.attack}HP`)
        } else {
          const prev = s.playerBase.hp
          s.playerBase.hp = Math.max(0, s.playerBase.hp - unit.attack)
          s.opponentScore += prev - s.playerBase.hp
          log.push(`${unit.name} hits Your Base! -${unit.attack}HP`)
        }
        unit.attackTimer = unit.attackCooldownMs
      }
    }
  }

  // Remove dead units
  s.field = s.field.filter(u => u.hp > 0)
}

// ─── Game Over Check ──────────────────────────────────────

function checkGameOver(s: GameState): boolean {
  if (s.playerBase.hp <= 0 || s.opponentBase.hp <= 0) {
    s.phase = { type: 'gameOver', winner: s.opponentBase.hp <= 0 ? 'player' : 'opponent' }
    return true
  }
  return false
}

// ─── Opponent AI ─────────────────────────────────────────

function opponentAI(s: GameState, log: string[]): void {
  const manaBonus = getManaBonus(s.field, 'opponent')
  let mana = Math.min(10, BASE_MAX_MANA + manaBonus)

  let played = 0
  while (played < 2) {
    const affordable = s.opponentHand.filter(c => c.cost <= mana)
    if (affordable.length === 0) break

    const opponentUnits = s.field.filter(u => u.owner === 'opponent')
    const playerUnits = s.field.filter(u => u.owner === 'player')
    const wantsUnit = opponentUnits.length <= playerUnits.length
    const preferred = wantsUnit ? affordable.filter(c => c.cardType !== 'upgrade') : affordable
    const pool = preferred.length > 0 ? preferred : affordable

    const card = pool[Math.floor(Math.random() * pool.length)]
    s.opponentHand.splice(s.opponentHand.indexOf(card), 1)
    mana -= card.cost
    played++

    deployCard(s, card, 'opponent', log)
    drawCard(s.opponentDeck, s.opponentHand)

    if (played === 1 && Math.random() > 0.4) break
  }

  if (played === 0) log.push('Opponent holds.')
}

// ─── Tick (called every ~100 ms) ─────────────────────────

export function tick(state: GameState, deltaMs: number): GameState {
  if (state.phase.type !== 'playing') return state

  const s = structuredClone(state)
  const log: string[] = []

  s.gameTime += deltaMs

  // 1. Mana regen
  const manaBonus = getManaBonus(s.field, 'player')
  s.maxMana = Math.min(10, BASE_MAX_MANA + manaBonus)

  if (s.mana < s.maxMana) {
    s.manaAccum += deltaMs / MANA_REGEN_MS
    while (s.manaAccum >= 1 && s.mana < s.maxMana) {
      s.mana++
      s.manaAccum -= 1
    }
    if (s.mana >= s.maxMana) s.manaAccum = 0
  }

  // 2. Card cooldown
  if (s.cardCooldown > 0) {
    s.cardCooldown = Math.max(0, s.cardCooldown - deltaMs)
  }

  // 3. Move all units
  moveUnits(s, deltaMs)

  // 4. Process per-unit attacks
  processAttacks(s, deltaMs, log)
  if (checkGameOver(s)) {
    s.log = [...s.log, ...log]
    return s
  }

  // 5. Tick spawner buildings
  for (const unit of s.field) {
    if (unit.spawnTimer == null || unit.structureEffect?.type !== 'spawn') continue
    unit.spawnTimer -= deltaMs
    if (unit.spawnTimer <= 0) {
      const effect = unit.structureEffect as { type: 'spawn'; unitTemplate: UnitTemplate; intervalMs: number }
      const spawned = spawnUnit(effect.unitTemplate, unit.owner)
      s.field.push(spawned)
      const who = unit.owner === 'player' ? 'Your' : 'Enemy'
      log.push(`${who} ${unit.name} spawned a ${spawned.name}!`)
      unit.spawnTimer = effect.intervalMs
    }
  }

  // 6. Opponent timer
  s.opponentTimer -= deltaMs
  if (s.opponentTimer <= 0) {
    opponentAI(s, log)
    s.opponentTimer = OPPONENT_INTERVAL_MS
  }

  // 7. Sudden death — trigger when all cards have been drawn and played
  if (!s.suddenDeath) {
    const allExhausted =
      s.playerDeck.length === 0 && s.playerHand.length === 0 &&
      s.opponentDeck.length === 0 && s.opponentHand.length === 0
    if (allExhausted) {
      s.suddenDeath = true
      s.suddenDeathTimer = SUDDEN_DEATH_MS
      log.push('⚡ SUDDEN DEATH! 60s remain — highest score wins!')
    }
  } else {
    s.suddenDeathTimer -= deltaMs
    if (s.suddenDeathTimer <= 0) {
      const winner = s.playerScore > s.opponentScore ? 'player'
        : s.opponentScore > s.playerScore ? 'opponent'
        : 'draw'
      s.phase = { type: 'gameOver', winner }
      s.log = [...s.log, ...log]
      return s
    }
  }

  if (log.length > 0) s.log = [...s.log, ...log]
  return s
}
