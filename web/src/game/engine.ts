import { GameState, BattleState, Card, PathNode } from './types'
import { makeDeck } from './cards'
import { generatePath } from './path'

// ─── Helpers ─────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// ─── New Game ────────────────────────────────────────────

export function newGame(): GameState {
  const nodes = generatePath()
  const startNode = nodes.find(n => n.step === 0)!
  startNode.isVisited = true
  const deck = shuffle(makeDeck())
  const hand = deck.slice(0, 7)
  const drawPile = deck.slice(7)

  return {
    allNodes: nodes,
    currentNodeId: startNode.id,
    hand,
    drawPile,
    discardPile: [],
    rewardChoices: [],
    playerHP: 20,
    playerMaxHP: 20,
    phase: { type: 'movement' },
    activeBattle: null,
    currentStep: 0,
    turnNumber: 0,
    message: 'Choose a card to move.',
  }
}

// ─── Movement Target Resolution ─────────────────────────

export function resolveMovementTargets(card: Card, state: GameState): string[] {
  const effect = card.sideA

  if (effect.type === 'moveSteps') {
    const targetStep = Math.min(state.currentStep + effect.value, 10)
    return state.allNodes.filter(n => n.step === targetStep).map(n => n.id)
  }

  if (effect.type === 'jumpToNextReward') {
    for (let step = state.currentStep + 1; step <= 10; step++) {
      const rewards = state.allNodes.filter(n => n.step === step && n.spaceType === 'reward')
      if (rewards.length > 0) return rewards.map(n => n.id)
    }
    // Fallback: move 1 step
    return state.allNodes.filter(n => n.step === state.currentStep + 1).map(n => n.id)
  }

  // Non-movement side A: fallback move 1
  return state.allNodes.filter(n => n.step === state.currentStep + 1).map(n => n.id)
}

// ─── Enemy Templates ────────────────────────────────────

function enemyForStep(step: number): BattleState {
  if (step <= 3) return { enemyName: 'Goblin',  enemyHP: 8,  enemyMaxHP: 8,  enemyDamagePerTurn: 3, playerBlockThisTurn: 0, log: [], isResolved: false }
  if (step <= 6) return { enemyName: 'Bandit',  enemyHP: 10, enemyMaxHP: 10, enemyDamagePerTurn: 4, playerBlockThisTurn: 0, log: [], isResolved: false }
  if (step <= 9) return { enemyName: 'Troll',   enemyHP: 12, enemyMaxHP: 12, enemyDamagePerTurn: 5, playerBlockThisTurn: 0, log: [], isResolved: false }
  return                 { enemyName: 'Shadow',  enemyHP: 8,  enemyMaxHP: 8,  enemyDamagePerTurn: 3, playerBlockThisTurn: 0, log: [], isResolved: false }
}

// ─── Play Card for Movement ─────────────────────────────

export function playCardForMovement(
  state: GameState,
  cardId: string,
  destinationId: string,
): GameState {
  const s = structuredClone(state)

  const cardIdx = s.hand.findIndex(c => c.id === cardId)
  if (cardIdx === -1) return state

  const card = s.hand.splice(cardIdx, 1)[0]
  s.discardPile.push(card)
  s.turnNumber++

  const destNode = s.allNodes.find(n => n.id === destinationId)
  if (!destNode) return state

  // Mark current & destination as visited
  const curIdx = s.allNodes.findIndex(n => n.id === s.currentNodeId)
  if (curIdx >= 0) s.allNodes[curIdx].isVisited = true
  const destIdx = s.allNodes.findIndex(n => n.id === destinationId)
  if (destIdx >= 0) s.allNodes[destIdx].isVisited = true

  s.currentNodeId = destinationId
  s.currentStep = destNode.step

  // Transition phase
  switch (destNode.spaceType) {
    case 'battle': {
      const battle = enemyForStep(destNode.step)
      s.activeBattle = battle
      s.phase = { type: 'battle' }
      s.message = `A ${battle.enemyName} blocks your path!`
      break
    }
    case 'reward':
      s.phase = { type: 'reward' }
      s.message = 'You found a treasure!'
      break
    case 'boss': {
      const boss: BattleState = {
        enemyName: 'DRAGON LORD', enemyHP: 15, enemyMaxHP: 15,
        enemyDamagePerTurn: 7, playerBlockThisTurn: 0, log: [], isResolved: false,
      }
      s.activeBattle = boss
      s.phase = { type: 'bossFight' }
      s.message = 'The DRAGON LORD awaits!'
      break
    }
    default: break
  }

  // Check lose: no cards in battle
  if (s.hand.length === 0 && (s.phase.type === 'battle' || s.phase.type === 'bossFight')) {
    s.phase = { type: 'gameOver', won: false }
    s.message = 'You have no cards left!'
  }

  return s
}

// ─── Play Card for Combat ───────────────────────────────

export function playCardForCombat(state: GameState, cardId: string): GameState {
  const s = structuredClone(state)
  if (!s.activeBattle) return state

  const cardIdx = s.hand.findIndex(c => c.id === cardId)
  if (cardIdx === -1) return state

  const card = s.hand.splice(cardIdx, 1)[0]
  s.discardPile.push(card)
  s.turnNumber++

  const battle = s.activeBattle
  const effect = card.sideB

  // Apply combat effect
  switch (effect.type) {
    case 'dealDamage':
      battle.enemyHP -= effect.value
      battle.log.push(`You deal ${effect.value} damage!`)
      break
    case 'healHP': {
      const healed = Math.min(effect.value, s.playerMaxHP - s.playerHP)
      s.playerHP += healed
      battle.log.push(`You heal ${healed} HP!`)
      break
    }
    case 'block':
      battle.playerBlockThisTurn += effect.value
      battle.log.push(`You raise a shield! (+${effect.value} block)`)
      break
    default:
      battle.log.push('That card has no combat effect!')
  }

  // Enemy defeated?
  if (battle.enemyHP <= 0) {
    battle.enemyHP = 0
    battle.isResolved = true
    battle.log.push(`${battle.enemyName} defeated!`)

    if (s.phase.type === 'bossFight') {
      s.phase = { type: 'gameOver', won: true }
      s.message = 'You defeated the DRAGON LORD!'
    } else {
      s.activeBattle = null
      // Offer 3 cards as battle reward
      const choices = prepareRewardChoices(s, 3)
      s.rewardChoices = choices
      if (choices.length > 0) {
        s.phase = { type: 'battleReward' }
        s.message = 'Victory! Choose a card as your reward.'
      } else {
        s.phase = { type: 'movement' }
        s.message = 'Victory! No cards to offer. Choose your next move.'
      }
    }
    return s
  }

  // Enemy attacks
  const dmg = Math.max(0, battle.enemyDamagePerTurn - battle.playerBlockThisTurn)
  s.playerHP -= dmg
  battle.playerBlockThisTurn = 0

  if (dmg > 0) {
    battle.log.push(`${battle.enemyName} hits you for ${dmg} damage!`)
  } else {
    battle.log.push('Your shield absorbs the blow!')
  }

  // Check lose
  if (s.playerHP <= 0) {
    s.playerHP = 0
    s.phase = { type: 'gameOver', won: false }
    s.message = 'You have been slain...'
    return s
  }

  if (s.hand.length === 0) {
    s.phase = { type: 'gameOver', won: false }
    s.message = 'You have no cards left!'
    return s
  }

  return s
}

// ─── Reward Helpers ─────────────────────────────────────

function prepareRewardChoices(s: GameState, count: number): Card[] {
  // Reshuffle if needed
  if (s.drawPile.length < count && s.discardPile.length > 0) {
    s.drawPile = [...s.drawPile, ...shuffle(s.discardPile)]
    s.discardPile = []
  }
  // Pull up to `count` cards from draw pile as choices
  const n = Math.min(count, s.drawPile.length)
  return s.drawPile.splice(0, n)
}

// ─── Collect Reward (reward space — 1 random card) ──────

export function collectReward(state: GameState): GameState {
  const s = structuredClone(state)

  if (s.drawPile.length === 0 && s.discardPile.length > 0) {
    s.drawPile = shuffle(s.discardPile)
    s.discardPile = []
  }

  if (s.drawPile.length > 0) {
    const card = s.drawPile.shift()!
    s.hand.push(card)
    s.message = `You drew ${card.name}! Choose your next move.`
  } else {
    s.message = 'No cards to draw. Choose your next move.'
  }

  s.phase = { type: 'movement' }
  return s
}

// ─── Collect Battle Reward (pick 1 of 3) ────────────────

export function collectBattleReward(state: GameState, chosenCardId: string): GameState {
  const s = structuredClone(state)

  const chosen = s.rewardChoices.find(c => c.id === chosenCardId)
  if (chosen) {
    s.hand.push(chosen)
    const unchosen = s.rewardChoices.filter(c => c.id !== chosenCardId)
    s.drawPile = shuffle([...s.drawPile, ...unchosen])
    s.message = `You chose ${chosen.name}! Choose your next move.`
  }

  s.rewardChoices = []
  s.phase = { type: 'movement' }
  return s
}

export function skipBattleReward(state: GameState): GameState {
  const s = structuredClone(state)
  s.drawPile = shuffle([...s.drawPile, ...s.rewardChoices])
  s.rewardChoices = []
  s.phase = { type: 'movement' }
  s.message = 'Reward skipped. Choose your next move.'
  return s
}

// ─── ASCII Path Map Rendering ───────────────────────────

export function renderPathMap(state: GameState): string {
  const lines: string[] = []

  for (let step = 10; step >= 0; step--) {
    const nodesAtStep = state.allNodes
      .filter(n => n.step === step)
      .sort((a, b) => a.branchIndex - b.branchIndex)

    let nodeLine = `Step${String(step).padStart(2, ' ')}: `

    for (const node of nodesAtStep) {
      const sym = nodeSymbol(node)
      let display: string
      if (node.id === state.currentNodeId) {
        display = `>${sym}<`
      } else if (node.isVisited) {
        display = ` ${sym.slice(0, 1)}${sym[1]}.${sym.slice(2)} `
      } else {
        display = ` ${sym} `
      }
      nodeLine += display + '  '
    }

    lines.push(nodeLine)

    if (step > 0) {
      let connector = '         '
      for (let i = 0; i < nodesAtStep.length; i++) {
        connector += '  |    '
      }
      lines.push(connector)
    }
  }

  return lines.join('\n')
}

function nodeSymbol(node: PathNode): string {
  switch (node.spaceType) {
    case 'start':  return '[@]'
    case 'battle': return '[X]'
    case 'reward': return '[R]'
    case 'boss':   return '[!]'
  }
}

// ─── Display Helpers ────────────────────────────────────

export function hpBar(current: number, max: number, label: string): string {
  const filled = Math.max(0, Math.round((current / max) * 10))
  const empty = 10 - filled
  return `${label} [${'#'.repeat(filled)}${'.'.repeat(empty)}] ${current}/${max}`
}
