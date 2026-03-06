import { GameState, Card, Unit, UnitTemplate, UpgradeEffect, CardRarity, LANE_WIDTH, BattleEventState, TerrainObstacle, TerrainType } from './types'
import { makeDeck, makeThorlordDeck, HERO_CARDS } from './cards'
import { playUnitDeath, playBuildingDestroyed } from './sound'

// ─── Constants ────────────────────────────────────────────

const OPPONENT_INTERVAL_MS = 8000
const MANA_REGEN_MS = 3000       // 1 mana every 3 seconds
const BASE_MAX_MANA = 5
const SUDDEN_DEATH_MS = 60000
const BATTLE_EVENT_BASE_MS = 30000  // first event after 30s, then every 24-32s
const SPAWN_GROW_MS = 1500           // building-spawn grow-in animation duration

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

// ─── Terrain Generation ───────────────────────────────────
//
// Scatter rocks, trees, water, and ruins across the mid-field.
// Three Y corridors (–55, 0, +55) are guaranteed clear so units
// always have at least 3 walkable paths from base to base.

const TERRAIN_CLEAR_Y   = [-70, 70] as const  // two edge corridors units route around
const TERRAIN_CLEAR_HALF = 12                  // half-width of each corridor (px)

function generateTerrain(): TerrainObstacle[] {
  const TYPES: TerrainType[] = ['rock', 'tree', 'water', 'ruin']
  const obstacles: TerrainObstacle[] = []
  const count = 4 + Math.floor(Math.random() * 5)  // 4–8 obstacles per battle
  let id = 0
  let tries = 0

  while (obstacles.length < count && tries++ < 150) {
    const x      = 90  + Math.random() * 320        // 90–410, away from spawn zones
    const y      = (Math.random() * 150) - 75        // –75 to 75
    const radius = 20  + Math.random() * 12          // 20–32 px
    const type   = TYPES[Math.floor(Math.random() * TYPES.length)]

    // Reject if it would block any guaranteed corridor
    if (TERRAIN_CLEAR_Y.some(cy => Math.abs(y - cy) < TERRAIN_CLEAR_HALF + radius)) continue

    // Reject if it overlaps an existing obstacle (with a small gap buffer)
    if (obstacles.some(o => Math.hypot(x - o.x, y - o.y) < radius + o.radius + 10)) continue

    obstacles.push({ id: `t${++id}`, type, x, y, radius })
  }

  return obstacles
}

export const MAX_HANDICAP = 20

/**
 * Start a new game.
 * @param playerCards  Optional custom deck for the player (defaults to makeDeck()).
 * @param opponentHandicap  Cards removed from the opponent's deck (adaptive difficulty).
 *   Increases by 1 on each player loss, decreases by 1 on each win (floor 0).
 */
// ─── Difficulty scaling ───────────────────────────────────
//
// The handicap (0–20) controls what rarities the opponent can draw.
// 0  = hardest (full deck, legendaries included) — player is on a win-streak
// 20 = easiest (commons only) — player has been losing repeatedly
//
// Thresholds also apply to campaign nodes: a node with handicap 8 puts the
// opponent on uncommon-max, making early acts beatable with a starter deck.

const RARITY_RANK: Record<CardRarity, number> = { common: 0, uncommon: 1, rare: 2, legendary: 3 }

function maxRarityForHandicap(h: number): CardRarity {
  if (h >= 12) return 'common'
  if (h >= 7)  return 'uncommon'
  if (h >= 3)  return 'rare'
  return 'legendary'
}

/** Opponent acts faster at low handicap (player is skilled), slower at high handicap (player is struggling). */
function opponentIntervalForHandicap(h: number): number {
  if (h >= 10) return 10000
  if (h >= 5)  return 9000
  return OPPONENT_INTERVAL_MS  // 8000
}

const STRATEGIES: GameState['opponentStrategy'][] = ['swarm', 'turtle', 'rush']
const STRATEGY_LABELS: Record<GameState['opponentStrategy'], string> = {
  swarm:  'Swarming with cheap units!',
  turtle: 'Fortifying with structures!',
  rush:   'Unleashing heavy hitters!',
}

/** Inject one hero card into the first ~8 positions of a shuffled deck. */
function injectHero(deck: Card[], heroPool: Card[]): void {
  if (heroPool.length === 0) return
  const hero = heroPool[Math.floor(Math.random() * heroPool.length)]
  const pos = Math.floor(Math.random() * Math.min(8, deck.length + 1))
  deck.splice(pos, 0, { ...hero, id: `hero-${uid()}` })
}

export function newGame(playerCards?: Card[], opponentHandicap = 0, bossAI?: string): GameState {
  const playerDeck = shuffle(playerCards ?? makeDeck())

  // Boss fights use their own curated deck instead of the standard one
  const clamp = Math.min(Math.max(0, opponentHandicap), MAX_HANDICAP)

  let opponentDeck: Card[]
  if (bossAI === 'thornlord') {
    opponentDeck = shuffle(makeThorlordDeck())  // bosses always play their full deck
  } else {
    // Filter the opponent deck to only include cards up to the allowed rarity tier.
    // This makes the handicap system meaningful: at high handicap the opponent
    // draws only commons (comparable to a starter deck), never Behemoths.
    const maxRarity = maxRarityForHandicap(clamp)
    const filtered  = makeDeck().filter(c => RARITY_RANK[c.rarity] <= RARITY_RANK[maxRarity])
    opponentDeck = shuffle(filtered)
  }

  // Inject one hero card per side (not for bosses — they have their own identity)
  injectHero(playerDeck, HERO_CARDS)
  if (!bossAI) injectHero(opponentDeck, HERO_CARDS)

  const playerHand = playerDeck.splice(0, 4)
  const opponentHand = opponentDeck.splice(0, 4)

  const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)]

  const maxRarity     = bossAI ? 'legendary' : maxRarityForHandicap(clamp)
  const oppIntervalMs = bossAI === 'thornlord' ? 6000 : opponentIntervalForHandicap(clamp)

  const diffLabel =
    maxRarity === 'common'    ? 'common-only' :
    maxRarity === 'uncommon'  ? 'no rares/legendaries' :
    maxRarity === 'rare'      ? 'no legendaries' :
    'full strength'

  const openingLog: string[] = bossAI === 'thornlord'
    ? [
        'THE THORNLORD awakens! Ancient guardian of the Verdant Shard.',
        'Walls of bark and root rise from the earth — prepare for a siege!',
      ]
    : [
        clamp > 0
          ? `Battle begins! (Enemy difficulty: ${diffLabel})`
          : 'Battle begins! Tap cards to deploy.',
        `Enemy strategy: ${STRATEGY_LABELS[strategy]}`,
      ]

  return {
    playerBase: { hp: 50, maxHp: 50 },
    opponentBase: { hp: 70, maxHp: 70 },  // boss gets extra base HP
    field: [],
    playerHand,
    playerDeck,
    opponentHand,
    opponentDeck,
    mana: 3,
    maxMana: BASE_MAX_MANA,
    manaAccum: 0,
    log: openingLog,
    phase: { type: 'playing' },
    opponentTimer: oppIntervalMs,
    opponentIntervalMs: oppIntervalMs,
    opponentStrategy: strategy,
    gameTime: 0,
    playerScore: 0,
    opponentScore: 0,
    suddenDeath: false,
    suddenDeathTimer: 0,
    battleEventTimer: BATTLE_EVENT_BASE_MS,
    activeBattleEvent: null,
    bossAI,
    terrain: generateTerrain(),
  }
}

// ─── Play Card (immediate deploy + cooldown) ─────────────

export function playCard(state: GameState, cardId: string): GameState {
  if (state.phase.type !== 'playing') return state

  const cardIdx = state.playerHand.findIndex(c => c.id === cardId)
  if (cardIdx === -1) return state

  const card = state.playerHand[cardIdx]
  if (state.mana < card.cost) return state

  const s = structuredClone(state)
  s.playerHand.splice(cardIdx, 1)
  s.mana -= card.cost

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
        if (existing.structureEffect?.type === 'mana') {
          const manaEffect = existing.structureEffect as { type: 'mana'; amount: number }
          manaEffect.amount += 1
          note += ', mana+1'
        }
        const who = owner === 'player' ? 'You' : 'Opponent'
        log.push(`${who} upgraded ${existing.name}! (${note})`)
        return
      }
    }
    const unit = spawnUnit(card.unit!, owner)
    // Assign a stable lateral slot to non-wall structures so that units
    // spawned from them start at the same horizontal position.
    if (card.cardType === 'structure' && !card.unit!.isWall) {
      // Spread buildings evenly; pick first slot not already occupied by a same-side structure
      const STRUCTURE_Y_SLOTS = [-65, -40, -15, 15, 40, 65, -55, -25, 5, 30, 55, 0, -75, -50, 50, 75]
      const usedY = new Set(
        s.field.filter(u => u.moveSpeed === 0 && !u.isWall && u.owner === owner).map(u => u.y)
      )
      unit.y = STRUCTURE_Y_SLOTS.find(y => !usedY.has(y)) ?? STRUCTURE_Y_SLOTS[0]
    }
    s.field.push(unit)
    const verb = card.cardType === 'structure' ? 'built' : 'deployed'
    const who = owner === 'player' ? 'You' : 'Opponent'
    // Hero cards deploy their unit AND apply a buff to all friendly units
    if (card.isHero && card.heroEffect) {
      log.push(`★ HERO ${card.name} unleashed by ${who}!`)
      applyUpgrade(s, card.heroEffect, owner, log)
    } else {
      log.push(`${who} ${verb} ${unit.name}.`)
    }
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
    // Fog of War battle event halves all movement
    const fogMult = s.activeBattleEvent?.type === 'fogOfWar' ? 0.5 : 1
    const speed = (inWallZone ? unit.moveSpeed * CLIMB_SPEED_FACTOR : unit.moveSpeed) * deltaSec * fogMult

    // Terrain avoidance: lateral repulsion from nearby obstacles.
    // Flying units soar over terrain; structures are already skipped above.
    let avoidY = 0
    if (!unit.flying) {
      for (const obs of s.terrain) {
        const toObsX = obs.x - unit.x
        const toObsY = obs.y - unit.y
        const dist   = Math.sqrt(toObsX * toObsX + toObsY * toObsY)
        const pushDist = obs.radius + 50  // detection radius
        if (dist < pushDist && dist > 0) {
          const strength = (pushDist - dist) / pushDist  // 0..1, stronger when closer
          // Push laterally away from the obstacle centre
          avoidY += (-toObsY / dist) * strength * unit.moveSpeed
        }
      }
    }

    // Move at full speed toward target, clamped so we don't overshoot
    const step = Math.min(speed, d)
    unit.x = Math.min(LANE_WIDTH, Math.max(0,         unit.x + (dx / d) * step))
    unit.y = Math.min(LANE_MAX_Y, Math.max(LANE_MIN_Y, unit.y + (dy / d) * step + avoidY * deltaSec))
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
      const bloodMoonMult = s.activeBattleEvent?.type === 'bloodMoon' ? 2 : 1
      target.hp -= unit.attack * bloodMoonMult
      const actualDamage = prevHp - Math.max(0, target.hp)
      if (isPlayer) s.playerScore += actualDamage
      else s.opponentScore += actualDamage
      unit.attackTimer = unit.attackCooldownMs
      if (target.hp <= 0) {
        log.push(`${unit.name} destroyed ${target.name}!`)
        if (target.moveSpeed === 0) playBuildingDestroyed()
        else playUnitDeath()
      }
    } else {
      // No enemies in range — attack the base if close enough
      const atEnemyBase = isPlayer
        ? unit.x >= LANE_WIDTH - unit.attackRange
        : unit.x <= unit.attackRange

      if (atEnemyBase) {
        const bloodMoonMult = s.activeBattleEvent?.type === 'bloodMoon' ? 2 : 1
        const dmg = unit.attack * bloodMoonMult
        if (isPlayer) {
          const prev = s.opponentBase.hp
          s.opponentBase.hp = Math.max(0, s.opponentBase.hp - dmg)
          s.playerScore += prev - s.opponentBase.hp
          log.push(`${unit.name} hits Enemy Base! -${dmg}HP`)
        } else {
          const prev = s.playerBase.hp
          s.playerBase.hp = Math.max(0, s.playerBase.hp - dmg)
          s.opponentScore += prev - s.playerBase.hp
          log.push(`${unit.name} hits Your Base! -${dmg}HP`)
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

  const strategy = s.opponentStrategy
  const maxPlays = strategy === 'swarm' ? 3 : 2

  let played = 0
  while (played < maxPlays) {
    const affordable = s.opponentHand.filter(c => c.cost <= mana)
    if (affordable.length === 0) break

    let preferred: Card[]
    if (strategy === 'swarm') {
      // Prefer cheap units; flood the board
      preferred = affordable.filter(c => c.cost <= 2 && c.cardType === 'unit')
    } else if (strategy === 'turtle') {
      // Prefer structures; be defensive
      preferred = affordable.filter(c => c.cardType === 'structure')
    } else {
      // rush: prefer expensive units
      preferred = affordable.filter(c => c.cost >= 3 && c.cardType !== 'structure')
    }
    const pool = preferred.length > 0 ? preferred : affordable

    const card = pool[Math.floor(Math.random() * pool.length)]
    s.opponentHand.splice(s.opponentHand.indexOf(card), 1)
    mana -= card.cost
    played++

    deployCard(s, card, 'opponent', log)
    drawCard(s.opponentDeck, s.opponentHand)

    // Turtle only plays 1 card per turn
    if (strategy === 'turtle') break
    // Others have a random early-stop chance
    if (played === 1 && Math.random() > 0.5) break
  }

  if (played === 0) log.push('Opponent holds.')
}

// ─── Thornlord Boss AI ───────────────────────────────────
//
// Priority order each turn:
//   1. Build Wall (walls every turn is the theme)
//   2. Spawn-structure (Barracks, Crypt, etc.)
//   3. Mana structure (Farm)
//   4. Cheapest available unit
//   5. Any upgrade
// Plays up to 3 cards per turn; uses a 6s interval (set in newGame).

function thornlordAI(s: GameState, log: string[]): void {
  const manaBonus = getManaBonus(s.field, 'opponent')
  let mana = Math.min(10, BASE_MAX_MANA + manaBonus)

  function tryPlay(): boolean {
    const hand = s.opponentHand.filter(c => c.cost <= mana)
    if (hand.length === 0) return false

    // Priority 1: walls
    const walls = hand.filter(c => c.cardType === 'structure' && c.unit?.isWall)
    // Priority 2: spawner structures
    const spawners = hand.filter(c => c.cardType === 'structure' && c.unit?.structureEffect?.type === 'spawn')
    // Priority 3: mana structures
    const manaStructs = hand.filter(c => c.cardType === 'structure' && c.unit?.structureEffect?.type === 'mana')
    // Priority 4: units (cheapest)
    const units = hand.filter(c => c.cardType === 'unit').sort((a, b) => a.cost - b.cost)
    // Priority 5: upgrades
    const upgrades = hand.filter(c => c.cardType === 'upgrade')

    const pick = (walls[0] ?? spawners[0] ?? manaStructs[0] ?? units[0] ?? upgrades[0])
    if (!pick) return false

    s.opponentHand.splice(s.opponentHand.indexOf(pick), 1)
    mana -= pick.cost
    deployCard(s, pick, 'opponent', log)
    drawCard(s.opponentDeck, s.opponentHand)
    return true
  }

  let played = 0
  while (played < 3 && tryPlay()) played++

  if (played === 0) log.push('The Thornlord is still…')
}

// ─── Battle Events ────────────────────────────────────────

function triggerBattleEvent(s: GameState, log: string[]): void {
  const roll = Math.random()
  let event: BattleEventState

  if (roll < 0.25) {
    // Blood Moon: all attacks deal double damage for 15s
    event = { type: 'bloodMoon', label: '🌑 BLOOD MOON! Double damage for 15s!', remainingMs: 15000 }
  } else if (roll < 0.5) {
    // Fog of War: all units move at half speed for 12s
    event = { type: 'fogOfWar', label: '🌫 FOG OF WAR! Movement halved for 12s!', remainingMs: 12000 }
  } else if (roll < 0.75) {
    // Supply Drop: both sides gain +3 mana instantly
    const bonus = 3
    s.mana = Math.min(s.maxMana, s.mana + bonus)
    const oppBonus = Math.min(10, BASE_MAX_MANA + getManaBonus(s.field, 'opponent'))
    void oppBonus  // opponent mana is virtual per-turn; just note the event
    event = { type: 'supplyDrop', label: `📦 SUPPLY DROP! Both sides gain +${bonus} mana!`, remainingMs: 3000 }
    log.push(`Supply Drop! You gained +${bonus} mana.`)
  } else {
    // Earthquake: all walls take 20 damage
    const dmg = 20
    for (const u of s.field) {
      if (u.isWall) u.hp = Math.max(0, u.hp - dmg)
    }
    s.field = s.field.filter(u => u.hp > 0)
    event = { type: 'earthquake', label: `🌋 EARTHQUAKE! All walls took ${dmg} damage!`, remainingMs: 3000 }
    log.push(`Earthquake! All walls shook for ${dmg} damage!`)
  }

  s.activeBattleEvent = event
  log.push(event.label)
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

  // 2. Move all units
  moveUnits(s, deltaMs)

  // 4. Process per-unit attacks
  processAttacks(s, deltaMs, log)
  if (checkGameOver(s)) {
    s.log = [...s.log, ...log]
    return s
  }

  // 5. Tick spawn-grow timers and spawner buildings
  for (const unit of s.field) {
    if (unit.spawnGrowTimer != null && unit.spawnGrowTimer > 0) {
      unit.spawnGrowTimer = Math.max(0, unit.spawnGrowTimer - deltaMs)
    }
    if (unit.spawnTimer == null || unit.structureEffect?.type !== 'spawn') continue
    unit.spawnTimer -= deltaMs
    if (unit.spawnTimer <= 0) {
      const effect = unit.structureEffect as { type: 'spawn'; unitTemplate: UnitTemplate; intervalMs: number }
      const spawned = spawnUnit(effect.unitTemplate, unit.owner)
      // Spawn at building's position and animate growing in
      spawned.x = unit.x
      spawned.y = unit.y   // inherit the building's lateral lane slot
      spawned.spawnGrowTimer = SPAWN_GROW_MS
      s.field.push(spawned)
      const who = unit.owner === 'player' ? 'Your' : 'Enemy'
      log.push(`${who} ${unit.name} spawned a ${spawned.name}!`)
      unit.spawnTimer = effect.intervalMs
    }
  }

  // 6. Opponent timer
  s.opponentTimer -= deltaMs
  if (s.opponentTimer <= 0) {
    if (s.bossAI === 'thornlord') {
      thornlordAI(s, log)
      s.opponentTimer = 6000
    } else {
      opponentAI(s, log)
      s.opponentTimer = s.opponentIntervalMs
    }
  }

  // 7. Battle events
  if (s.activeBattleEvent) {
    s.activeBattleEvent.remainingMs -= deltaMs
    if (s.activeBattleEvent.remainingMs <= 0) s.activeBattleEvent = null
  }
  s.battleEventTimer -= deltaMs
  if (s.battleEventTimer <= 0) {
    triggerBattleEvent(s, log)
    s.battleEventTimer = 24000 + Math.random() * 8000
  }

  // 9. Sudden death — trigger when all cards have been drawn and played
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
