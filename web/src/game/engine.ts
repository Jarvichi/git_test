import { GameState, Card, Unit, UnitTemplate, UpgradeEffect, QueuedCard } from './types'
import { makeDeck } from './cards'

// ─── Constants ────────────────────────────────────────────

export const COMBAT_INTERVAL_MS = 6000
const OPPONENT_INTERVAL_MS = 8000
const MANA_REGEN_MS = 3000       // 1 mana every 3 seconds
const BASE_MAX_MANA = 5

// ─── Helpers ─────────────────────────────────────────────

let _unitId = 0
function uid(): string { return `unit-${++_unitId}` }

let _queueId = 0
function quid(): string { return `q-${++_queueId}` }

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

export function hpBar(current: number, max: number): string {
  const filled = Math.max(0, Math.round((current / max) * 12))
  const empty = 12 - filled
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${max}`
}

function spawnUnit(template: UnitTemplate, owner: 'player' | 'opponent'): Unit {
  const unit: Unit = { ...template, id: uid(), owner, hp: template.maxHp, isNew: true }
  if (template.structureEffect?.type === 'spawn') {
    unit.spawnTimer = template.structureEffect.intervalMs
  }
  return unit
}

function defaultDeployMs(card: Card): number {
  if (card.deployMs) return card.deployMs
  if (card.cardType === 'structure') return 5000
  if (card.cardType === 'upgrade') return 1500
  return 3000
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
    playerBase: { hp: 20, maxHp: 20 },
    opponentBase: { hp: 20, maxHp: 20 },
    field: [],
    playerHand,
    playerDeck,
    opponentHand,
    opponentDeck,
    mana: 3,
    maxMana: BASE_MAX_MANA,
    manaAccum: 0,
    queue: [],
    log: ['⚔  Battle begins! Tap cards to queue them.'],
    phase: { type: 'playing' },
    combatTimer: COMBAT_INTERVAL_MS,
    opponentTimer: OPPONENT_INTERVAL_MS,
    turn: 0,
  }
}

// ─── Queue Card ───────────────────────────────────────────

export function queueCard(state: GameState, cardId: string): GameState {
  if (state.phase.type !== 'playing') return state

  const cardIdx = state.playerHand.findIndex(c => c.id === cardId)
  if (cardIdx === -1) return state

  const card = state.playerHand[cardIdx]
  if (state.mana < card.cost) return state

  const s = structuredClone(state)
  s.playerHand.splice(cardIdx, 1)
  s.mana -= card.cost

  const totalMs = defaultDeployMs(card)
  s.queue.push({ qId: quid(), card, msRemaining: totalMs, totalMs })

  drawCard(s.playerDeck, s.playerHand)
  s.log = [...s.log, `Queuing ${card.name}… marching to front.`]
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

// ─── Combat Resolution ────────────────────────────────────

function resolveCombat(s: GameState, log: string[]): void {
  const damageMap = new Map<string, number>()
  let playerBaseDmg = 0
  let opponentBaseDmg = 0

  for (const unit of s.field) {
    if (unit.attack === 0) continue

    const isPlayer = unit.owner === 'player'
    const enemies = s.field.filter(u => u.owner !== unit.owner)
    let target: Unit | null = null

    if (unit.bypassWall) {
      const nonWalls = enemies.filter(u => !u.isWall)
      if (nonWalls.length > 0) target = nonWalls[Math.floor(Math.random() * nonWalls.length)]
    } else {
      const walls = enemies.filter(u => u.isWall)
      if (walls.length > 0) {
        target = walls[Math.floor(Math.random() * walls.length)]
      } else if (enemies.length > 0) {
        target = enemies[Math.floor(Math.random() * enemies.length)]
      }
    }

    if (target) {
      damageMap.set(target.id, (damageMap.get(target.id) ?? 0) + unit.attack)
      log.push(`  ${unit.name} [${isPlayer ? 'YOU' : 'FOE'}] → ${target.name} -${unit.attack}HP`)
    } else {
      if (isPlayer) opponentBaseDmg += unit.attack
      else playerBaseDmg += unit.attack
      const baseLabel = isPlayer ? 'Enemy Base' : 'Your Base'
      log.push(`  ${unit.name} [${isPlayer ? 'YOU' : 'FOE'}] → ${baseLabel} -${unit.attack}HP`)
    }
  }

  for (const unit of s.field) {
    const dmg = damageMap.get(unit.id) ?? 0
    if (dmg > 0) unit.hp -= dmg
  }

  const before = s.field.length
  s.field = s.field.filter(u => u.hp > 0)
  const fallen = before - s.field.length
  if (fallen > 0) log.push(`  ${fallen} unit(s) destroyed.`)

  s.playerBase.hp = Math.max(0, s.playerBase.hp - playerBaseDmg)
  s.opponentBase.hp = Math.max(0, s.opponentBase.hp - opponentBaseDmg)
}

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

  if (played === 0) log.push('Opponent holds their ground.')
}

// ─── Tick (called every ~100 ms) ─────────────────────────

export function tick(state: GameState, deltaMs: number): GameState {
  if (state.phase.type !== 'playing') return state

  const s = structuredClone(state)
  const log: string[] = []

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

  // 2. Process player queue — deploy cards whose countdown expired
  const remaining: QueuedCard[] = []
  for (const qc of s.queue) {
    qc.msRemaining -= deltaMs
    if (qc.msRemaining <= 0) {
      deployCard(s, qc.card, 'player', log)
    } else {
      remaining.push(qc)
    }
  }
  s.queue = remaining

  // 3. Tick spawner buildings
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

  // 4. Combat timer
  s.combatTimer -= deltaMs
  if (s.combatTimer <= 0) {
    s.turn++
    log.push(`── ⚔ Combat Round ${s.turn} ──`)
    resolveCombat(s, log)
    if (checkGameOver(s)) {
      s.log = [...s.log, ...log]
      return s
    }
    s.combatTimer = COMBAT_INTERVAL_MS
  }

  // 5. Opponent timer
  s.opponentTimer -= deltaMs
  if (s.opponentTimer <= 0) {
    opponentAI(s, log)
    s.opponentTimer = OPPONENT_INTERVAL_MS
  }

  if (log.length > 0) s.log = [...s.log, ...log]
  return s
}
