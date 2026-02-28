import { GameState, Card, Unit, UnitTemplate, UpgradeEffect, LANE_WIDTH } from './types'
import { makeDeck } from './cards'

// ─── Constants ────────────────────────────────────────────

const OPPONENT_INTERVAL_MS = 8000
const MANA_REGEN_MS = 3000       // 1 mana every 3 seconds
const BASE_MAX_MANA = 5
export const CARD_COOLDOWN_MS = 5000  // 5 s between card plays

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

function spawnUnit(template: UnitTemplate, owner: 'player' | 'opponent'): Unit {
  const unit: Unit = {
    ...template,
    id: uid(),
    owner,
    hp: template.maxHp,
    x: owner === 'player' ? PLAYER_SPAWN_X : OPPONENT_SPAWN_X,
    attackTimer: 0,
  }
  if (template.structureEffect?.type === 'spawn') {
    unit.spawnTimer = template.structureEffect.intervalMs
  }
  // Structures stay at base
  if (template.moveSpeed === 0) {
    unit.x = owner === 'player' ? 10 : LANE_WIDTH - 10
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

export function newGame(): GameState {
  const playerDeck = shuffle(makeDeck())
  const opponentDeck = shuffle(makeDeck())
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
    log: ['Battle begins! Tap cards to deploy.'],
    phase: { type: 'playing' },
    opponentTimer: OPPONENT_INTERVAL_MS,
    gameTime: 0,
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
  }
}

// ─── Deploy a card onto the field ────────────────────────

function deployCard(s: GameState, card: Card, owner: 'player' | 'opponent', log: string[]): void {
  if (card.cardType === 'unit' || card.cardType === 'structure') {
    const unit = spawnUnit(card.unit!, owner)
    s.field.push(unit)
    const verb = card.cardType === 'structure' ? 'built' : 'deployed'
    const who = owner === 'player' ? 'You' : 'Opponent'
    log.push(`${who} ${verb} ${unit.name}.`)
  } else if (card.cardType === 'upgrade' && card.upgradeEffect) {
    applyUpgrade(s, card.upgradeEffect, owner, log)
  }
}

// ─── Movement ─────────────────────────────────────────────

function moveUnits(s: GameState, deltaMs: number): void {
  const deltaSec = deltaMs / 1000

  for (const unit of s.field) {
    if (unit.moveSpeed === 0) continue

    // Find nearest enemy in front of this unit
    const nearestEnemy = findNearestEnemy(s.field, unit)

    // Check if blocked by a wall
    if (nearestEnemy && nearestEnemy.isWall && !unit.bypassWall) {
      const dist = Math.abs(unit.x - nearestEnemy.x)
      if (dist <= unit.attackRange + 10) continue  // stop at wall
    }

    // Check if in attack range of any enemy — stop moving if so
    if (nearestEnemy) {
      const dist = Math.abs(unit.x - nearestEnemy.x)
      if (dist <= unit.attackRange) continue  // in range, stop
    }

    // Move toward enemy base
    const moveAmount = unit.moveSpeed * deltaSec
    if (unit.owner === 'player') {
      unit.x = Math.min(LANE_WIDTH, unit.x + moveAmount)
    } else {
      unit.x = Math.max(0, unit.x - moveAmount)
    }
  }
}

function findNearestEnemy(field: Unit[], unit: Unit): Unit | null {
  let nearest: Unit | null = null
  let nearestDist = Infinity

  for (const other of field) {
    if (other.owner === unit.owner) continue
    if (other.hp <= 0) continue

    // For melee units that can't bypass walls, walls are valid targets
    // For ranged units, skip walls (they bypass)
    if (other.isWall && unit.bypassWall) continue

    const dist = Math.abs(unit.x - other.x)

    // Only consider enemies "in front" of this unit
    if (unit.owner === 'player' && other.x < unit.x) continue
    if (unit.owner === 'opponent' && other.x > unit.x) continue

    if (dist < nearestDist) {
      nearestDist = dist
      nearest = other
    }
  }
  return nearest
}

// ─── Per-unit Combat ──────────────────────────────────────

function processAttacks(s: GameState, deltaMs: number, log: string[]): void {
  for (const unit of s.field) {
    if (unit.attack === 0 || unit.hp <= 0) continue

    // Tick attack cooldown
    if (unit.attackTimer > 0) {
      unit.attackTimer -= deltaMs
      continue
    }

    // Find target
    const target = findNearestEnemy(s.field, unit)
    const isPlayer = unit.owner === 'player'

    if (target) {
      const dist = Math.abs(unit.x - target.x)
      if (dist <= unit.attackRange) {
        // Attack!
        target.hp -= unit.attack
        unit.attackTimer = unit.attackCooldownMs
        if (target.hp <= 0) {
          log.push(`${unit.name} destroyed ${target.name}!`)
        }
      }
    } else {
      // No enemy units — attack the base if close enough
      const atEnemyBase = isPlayer
        ? unit.x >= LANE_WIDTH - unit.attackRange
        : unit.x <= unit.attackRange

      if (atEnemyBase) {
        if (isPlayer) {
          s.opponentBase.hp = Math.max(0, s.opponentBase.hp - unit.attack)
          log.push(`${unit.name} hits Enemy Base! -${unit.attack}HP`)
        } else {
          s.playerBase.hp = Math.max(0, s.playerBase.hp - unit.attack)
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

  if (log.length > 0) s.log = [...s.log, ...log]
  return s
}
