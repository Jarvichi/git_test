import { GameState, Card, Unit, UnitTemplate, UpgradeEffect } from './types'
import { makeDeck } from './cards'

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

export function hpBar(current: number, max: number): string {
  const filled = Math.max(0, Math.round((current / max) * 12))
  const empty = 12 - filled
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${max}`
}

function spawnUnit(template: UnitTemplate, owner: 'player' | 'opponent'): Unit {
  return { ...template, id: uid(), owner, hp: template.maxHp }
}

// ─── Mana / draw bonuses from structures ─────────────────

function getManaBonus(field: Unit[], owner: 'player' | 'opponent'): number {
  return field
    .filter(u => u.owner === owner && u.structureEffect?.type === 'mana')
    .reduce((sum, u) => sum + u.structureEffect!.amount, 0)
}

function getExtraDraw(field: Unit[], owner: 'player' | 'opponent'): number {
  return field
    .filter(u => u.owner === owner && u.structureEffect?.type === 'extraDraw')
    .reduce((sum, u) => sum + u.structureEffect!.amount, 0)
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
    maxMana: 3,
    log: ['⚔  Battle begins! Deploy your forces.'],
    phase: { type: 'playerTurn' },
    turn: 1,
  }
}

// ─── Play Card ───────────────────────────────────────────

export function playCard(state: GameState, cardId: string): GameState {
  const s = structuredClone(state)
  if (s.phase.type !== 'playerTurn') return state

  const cardIdx = s.playerHand.findIndex(c => c.id === cardId)
  if (cardIdx === -1) return state

  const card = s.playerHand[cardIdx]
  if (s.mana < card.cost) return state

  s.playerHand.splice(cardIdx, 1)
  s.mana -= card.cost

  if (card.cardType === 'unit' || card.cardType === 'structure') {
    const unit = spawnUnit(card.unit!, 'player')
    s.field.push(unit)
    const verb = card.cardType === 'structure' ? 'built' : 'deployed'
    s.log.push(`You ${verb} ${unit.name}.`)
  } else if (card.cardType === 'upgrade' && card.upgradeEffect) {
    applyUpgrade(s, card.upgradeEffect, 'player')
  }

  drawCard(s.playerDeck, s.playerHand)
  return s
}

// ─── Apply Upgrade ───────────────────────────────────────

function applyUpgrade(s: GameState, effect: UpgradeEffect, owner: 'player' | 'opponent'): void {
  const units = s.field.filter(u => u.owner === owner)
  const label = owner === 'player' ? 'Your' : 'Enemy'
  if (effect.type === 'buffAttack') {
    for (const u of units) u.attack += effect.amount
    s.log.push(`${label} units gain +${effect.amount} attack!`)
  } else if (effect.type === 'healUnits') {
    for (const u of units) u.hp = Math.min(u.maxHp, u.hp + effect.amount)
    s.log.push(`${label} units healed ${effect.amount} HP.`)
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
      // Ranged: skip walls, hit other units/structures first, then base
      const nonWalls = enemies.filter(u => !u.isWall)
      if (nonWalls.length > 0) target = nonWalls[Math.floor(Math.random() * nonWalls.length)]
    } else {
      // Melee: walls first, then any other unit/structure, then base
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

  // Apply damage simultaneously
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
  // Extra draw from Barracks
  const extraDraw = getExtraDraw(s.field, 'opponent')
  for (let i = 0; i < extraDraw; i++) drawCard(s.opponentDeck, s.opponentHand)

  const manaBonus = getManaBonus(s.field, 'opponent')
  let mana = Math.min(10, 3 + manaBonus)

  let played = 0
  while (played < 2) {
    const affordable = s.opponentHand.filter(c => c.cost <= mana)
    if (affordable.length === 0) break

    // Prefer deploying units/structures if field is weak; otherwise anything
    const opponentUnits = s.field.filter(u => u.owner === 'opponent')
    const playerUnits = s.field.filter(u => u.owner === 'player')
    const wantsUnit = opponentUnits.length <= playerUnits.length
    const preferred = wantsUnit
      ? affordable.filter(c => c.cardType !== 'upgrade')
      : affordable
    const pool = preferred.length > 0 ? preferred : affordable

    const card = pool[Math.floor(Math.random() * pool.length)]
    s.opponentHand.splice(s.opponentHand.indexOf(card), 1)
    mana -= card.cost
    played++

    if (card.cardType === 'unit' || card.cardType === 'structure') {
      const unit = spawnUnit(card.unit!, 'opponent')
      s.field.push(unit)
      log.push(`Opponent deploys ${unit.name}.`)
    } else if (card.cardType === 'upgrade' && card.upgradeEffect) {
      applyUpgrade(s, card.upgradeEffect, 'opponent')
    }

    drawCard(s.opponentDeck, s.opponentHand)

    // Only play second card 40% of the time
    if (played === 1 && Math.random() > 0.4) break
  }

  if (played === 0) log.push('Opponent holds their ground.')
}

// ─── End Turn ────────────────────────────────────────────

export function endTurn(state: GameState): GameState {
  const s = structuredClone(state)
  if (s.phase.type !== 'playerTurn') return state

  const log: string[] = []

  // Player's combat
  log.push('── Combat ──')
  resolveCombat(s, log)
  if (checkGameOver(s)) {
    s.log = [...s.log, ...log]
    return s
  }

  // Opponent's turn
  log.push("── Opponent's Turn ──")
  opponentAI(s, log)

  // Opponent's combat
  log.push('── Combat ──')
  resolveCombat(s, log)
  if (checkGameOver(s)) {
    s.log = [...s.log, ...log]
    return s
  }

  // Start next player turn
  s.turn++
  const manaBonus = getManaBonus(s.field, 'player')
  s.maxMana = Math.min(10, 3 + manaBonus)
  s.mana = s.maxMana

  // Extra draw from Barracks
  const extraDraw = getExtraDraw(s.field, 'player')
  for (let i = 0; i < extraDraw; i++) {
    drawCard(s.playerDeck, s.playerHand)
    log.push('  Barracks: drew +1 card.')
  }

  log.push(`── Turn ${s.turn} (Mana: ${s.mana}/${s.maxMana}) ──`)
  s.log = [...s.log, ...log]
  return s
}
