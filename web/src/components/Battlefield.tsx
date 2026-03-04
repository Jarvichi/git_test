import React, { useRef, useEffect, useState } from 'react'
import { GameState, Unit, LANE_WIDTH, Card, TerrainObstacle, TerrainType } from '../game/types'
import { CardTile } from './CardTile'
import { CardDetailModal } from './CardDetailModal'
import { SpriteImg, AnimatedSpriteImg } from './SpriteImg'
import { BattleEventOverlay } from './BattleEventOverlay'

interface Props {
  state: GameState
  onPlayCard: (cardId: string) => void
  actTheme?: string   // e.g. 'act1' — applied as CSS modifier class
}

const SPAWN_GROW_MS = 1500

function LaneUnit({ unit, stackIndex = 0 }: { unit: Unit; stackIndex?: number }) {
  const hpPct = Math.max(0, (unit.hp / unit.maxHp) * 100)
  const isStructure = unit.moveSpeed === 0

  // Vertical lane: top% based on x position (high x = near enemy = near top)
  const topPct = (1 - unit.x / LANE_WIDTH) * 100

  // Unit just attacked if timer is in the upper half of its cooldown
  const isAttacking = unit.attack > 0 && unit.attackCooldownMs > 0 &&
    unit.attackTimer > unit.attackCooldownMs * 0.6

  // Spawn grow-in animation: scale from 0 → 1 as spawnGrowTimer counts down
  const growScale = unit.spawnGrowTimer != null && unit.spawnGrowTimer > 0
    ? Math.max(0.05, 1 - unit.spawnGrowTimer / SPAWN_GROW_MS)
    : 1

  let style: React.CSSProperties
  if (unit.isWall) {
    // Walls span the full lane width, positioned by their x value
    style = { top: `${topPct}%`, left: 0, right: 0, transform: 'translateY(-50%)' }
  } else if (isStructure) {
    // Structures anchor to their base edge; horizontal position from unit.y (same scale as mobile units)
    const hPct = 50 + (unit.y / 80) * 36
    style = unit.owner === 'player'
      ? { bottom: '5px', left: `${hPct}%`, transform: 'translateX(-50%)' }
      : { top: '5px', left: `${hPct}%`, transform: 'translateX(-50%)' }
  } else {
    // Mobile units: lateral position derived from unit.y (-80..80 → 14..86%)
    const hPct = 50 + (unit.y / 80) * 36
    style = {
      top: `${topPct}%`,
      left: `${hPct}%`,
      transform: `translateX(-50%) translateY(-50%) scale(${growScale})`,
    }
  }

  return (
    <div
      className={[
        'lane-unit',
        `lane-unit--${unit.owner}`,
        isStructure ? 'lane-unit--structure' : '',
        unit.isWall ? 'lane-unit--wall' : '',
        isAttacking ? 'lane-unit--attacking' : '',
      ].filter(Boolean).join(' ')}
      style={style}
      title={`${unit.name} — ${unit.hp}/${unit.maxHp} HP, ${unit.attack} ATK`}
    >
      {isStructure
        ? <SpriteImg name={unit.name} className="lane-unit-sprite" />
        : <AnimatedSpriteImg name={unit.name} frameCount={3} fps={6} className="lane-unit-sprite" />
      }
      <div className="lane-unit-name">
        {unit.name}
        {unit.upgradeLevel != null && unit.upgradeLevel >= 2 && (
          <span className="lane-unit-level">Lv{unit.upgradeLevel}</span>
        )}
      </div>
      <div className="lane-unit-hp-bar">
        <div className="lane-unit-hp-fill" style={{ width: `${hpPct}%` }} />
      </div>
    </div>
  )
}

const TERRAIN_GLYPHS: Record<TerrainType, string[]> = {
  rock:  ['▓▒', '▒▓', '▓▓▒'],
  tree:  ['▲', '▲▲', '▲▲▲'],
  water: ['≋≋', '~~', '≋~≋'],
  ruin:  ['⊞⊟', '▣⊡', '⊟▤'],
}

function TerrainTile({ obs }: { obs: TerrainObstacle }) {
  const topPct  = (1 - obs.x / LANE_WIDTH) * 100
  const leftPct = 50 + (obs.y / 80) * 36
  // Pick a stable glyph variant based on obstacle id
  const variants = TERRAIN_GLYPHS[obs.type]
  const glyph = variants[parseInt(obs.id.replace('t', ''), 10) % variants.length]
  const fontSize = Math.round(18 + obs.radius * 0.6)
  return (
    <div
      className={`terrain-obstacle terrain-obstacle--${obs.type}`}
      style={{
        top:       `${topPct}%`,
        left:      `${leftPct}%`,
        transform: 'translateX(-50%) translateY(-50%)',
        fontSize:  `${fontSize}px`,
      }}
      title={obs.type}
    >
      {glyph}
    </div>
  )
}

function ManaBar({ mana, maxMana, manaAccum }: { mana: number; maxMana: number; manaAccum: number }) {
  const pips = Array.from({ length: maxMana }, (_, i) => {
    if (i < mana) return 'full'
    if (i === mana) return 'partial'
    return 'empty'
  })
  return (
    <div className="mana-bar">
      {pips.map((pipState, i) => (
        <span key={i} className={`mana-pip mana-pip--${pipState}`}>
          {pipState === 'partial'
            ? <span className="mana-pip-fill" style={{ width: `${manaAccum * 100}%` }} />
            : null}
        </span>
      ))}
    </div>
  )
}

function HpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, (current / max) * 100)
  return (
    <div className="hp-bar-track">
      <div className="hp-bar-fill" style={{ width: `${pct}%`, background: color }} />
      <span className="hp-bar-text">{current}/{max}</span>
    </div>
  )
}

const STRATEGY_LABELS: Record<string, string> = {
  swarm:  'SWARM',
  turtle: 'TURTLE',
  rush:   'RUSH',
}

export function Battlefield({ state, onPlayCard, actTheme }: Props) {
  const [detailCard, setDetailCard] = useState<Card | null>(null)
  const gameTimeSec = Math.floor(state.gameTime / 1000)
  const minutes = Math.floor(gameTimeSec / 60)
  const seconds = gameTimeSec % 60
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`
  const sdSec = Math.ceil(state.suddenDeathTimer / 1000)
  const event = state.activeBattleEvent

  return (
    <div className={`battlefield${actTheme ? ` battlefield--${actTheme}` : ''}`}>

      {/* Dramatic battle event overlay (center-screen flash) */}
      <BattleEventOverlay event={event} />

      {/* Sudden death banner */}
      {state.suddenDeath && (
        <div className="sudden-death-overlay">
          <span className="sudden-death-icon">⚡</span>
          <span className="sudden-death-text">SUDDEN DEATH — {sdSec}s</span>
        </div>
      )}

      {/* Top bar: clock, scores */}
      <div className={`top-bar${state.suddenDeath ? ' top-bar--sudden-death' : ''}`}>
        <span className="game-clock">{timeStr}</span>
        <span className="score-display">
          <span className="score-player">{state.playerScore}</span>
          <span className="score-sep"> – </span>
          <span className="score-opponent">{state.opponentScore}</span>
        </span>
        {event && (
          <span className={`event-status-chip event-status-chip--${event.type}`}>
            {event.type === 'bloodMoon' ? '🌑 BLOOD MOON'
            : event.type === 'fogOfWar' ? '🌫 FOG OF WAR'
            : event.type === 'supplyDrop' ? '📦 SUPPLY DROP'
            : '🌋 QUAKE'}
          </span>
        )}
      </div>

      {/* Opponent base */}
      <div className="base-bar base-bar--opponent">
        <span className="base-bar-label">ENEMY</span>
        <HpBar current={state.opponentBase.hp} max={state.opponentBase.maxHp} color="#ff4444" />
        <span className="base-bar-info">
          {STRATEGY_LABELS[state.opponentStrategy] && (
            <span className="strategy-label">{STRATEGY_LABELS[state.opponentStrategy]}</span>
          )}
          Hand: {state.opponentHand.length}
        </span>
      </div>

      {/* The Lane — vertical, fills remaining space */}
      <div className="lane">
        <div className="lane-ground" />
        {(state.terrain ?? []).map(obs => <TerrainTile key={obs.id} obs={obs} />)}
        {state.field.map((u, i) => {
          const stackIndex = u.moveSpeed === 0
            ? state.field.slice(0, i).filter(o => o.moveSpeed === 0 && o.owner === u.owner).length
            : 0
          return <LaneUnit key={u.id} unit={u} stackIndex={stackIndex} />
        })}
      </div>

      {/* Player base */}
      <div className="base-bar base-bar--player">
        <span className="base-bar-label">YOU</span>
        <HpBar current={state.playerBase.hp} max={state.playerBase.maxHp} color="#33ff33" />
        <span className="base-bar-info">
          MANA {state.mana}/{state.maxMana}
          <ManaBar mana={state.mana} maxMana={state.maxMana} manaAccum={state.manaAccum} />
        </span>
      </div>

      {/* Hand */}
      <div className="hand-panel">
        <div className="hand-header">
          <span className="hand-label">
            HAND ({state.playerHand.length}) | Deck: {state.playerDeck.length}
          </span>
        </div>
        <div className="hand-cards">
          {state.playerHand.length === 0
            ? <span className="field-empty">No cards</span>
            : state.playerHand.map(card => (
              <div key={card.id} className="hand-card-wrap">
                <CardTile
                  card={card}
                  canAfford={state.mana >= card.cost}
                  onClick={() => onPlayCard(card.id)}
                />
                <button
                  className="hand-card-info-btn"
                  onClick={e => { e.stopPropagation(); setDetailCard(card) }}
                >ⓘ</button>
              </div>
            ))}
        </div>
      </div>

      {detailCard && (
        <CardDetailModal
          card={detailCard}
          collection={[]}
          onClose={() => setDetailCard(null)}
        />
      )}
    </div>
  )
}
