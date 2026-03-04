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

// ─── Terrain SVG shapes ───────────────────────────────────────────────────────
// Using inline SVG guarantees rendering regardless of font glyph support.

function RockSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 22,20 2,20" fill="#6a6a5a" stroke="#bbbbaa" strokeWidth="1.5"/>
      <polygon points="6,11 18,11 20,20 4,20" fill="#4e4e40" stroke="#999988" strokeWidth="0.8"/>
      <polygon points="10,6 16,6 18,12 8,12" fill="#7a7a68" stroke="#aaaaaa" strokeWidth="0.5"/>
    </svg>
  )
}

function TreeSvg({ size }: { size: number }) {
  // Round deciduous blob canopies — cluster of overlapping circles
  return (
    <svg width={size} height={size} viewBox="0 0 46 40" xmlns="http://www.w3.org/2000/svg">
      {/* Back / shadow blobs */}
      <ellipse cx="11" cy="25" rx="10" ry="9"  fill="#1e4a1e"/>
      <ellipse cx="35" cy="26" rx="9"  ry="8"  fill="#1e4a1e"/>
      {/* Mid layer */}
      <ellipse cx="10" cy="18" rx="9"  ry="8"  fill="#2d6a2d"/>
      <ellipse cx="36" cy="19" rx="8"  ry="7"  fill="#2a6a2a"/>
      {/* Centre dominant canopy */}
      <ellipse cx="23" cy="16" rx="13" ry="12" fill="#317331"/>
      <ellipse cx="23" cy="11" rx="10" ry="8"  fill="#3a8a3a"/>
      {/* Highlight */}
      <ellipse cx="20" cy="9"  rx="5"  ry="3"  fill="#4aaa4a" opacity="0.45"/>
      {/* Trunks */}
      <line x1="10" y1="28" x2="9"  y2="39" stroke="#5a3010" strokeWidth="2"/>
      <line x1="36" y1="28" x2="37" y2="39" stroke="#5a3010" strokeWidth="2"/>
      <line x1="23" y1="25" x2="22" y2="39" stroke="#4a2a0a" strokeWidth="2.5"/>
    </svg>
  )
}

function WaterSvg({ size }: { size: number }) {
  // Irregular blob shape using bezier curves — no two pools look the same at different sizes
  return (
    <svg width={size} height={size} viewBox="0 0 34 26" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5,11 C3,5 7,1 13,2 C17,0 23,1 27,5 C32,6 34,12 30,17 C28,21 22,24 16,23 C9,24 3,21 1,17 C-1,14 3,14 5,11 Z"
        fill="#0a3055" stroke="#44aaff" strokeWidth="1.2"
      />
      <path d="M7,10 Q12,7 18,9"  fill="none" stroke="#88ccff" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M5,15 Q12,11 22,14" fill="none" stroke="#66aadd" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M9,19 Q16,16 26,18" fill="none" stroke="#55aaee" strokeWidth="1.0" strokeLinecap="round"/>
      <ellipse cx="22" cy="8" rx="3" ry="1.5" fill="#66ccff" opacity="0.35"/>
    </svg>
  )
}

function RuinSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="11" width="5" height="11" fill="#5a4a3a" stroke="#c8a060" strokeWidth="1.5"/>
      <rect x="9" y="5" width="6" height="17" fill="#4a3a2a" stroke="#c8a060" strokeWidth="1.5"/>
      <rect x="17" y="14" width="5" height="8" fill="#6a5a4a" stroke="#c8a060" strokeWidth="1.5"/>
      <line x1="2" y1="11" x2="6" y2="4" stroke="#c8a060" strokeWidth="1.5"/>
      <line x1="17" y1="14" x2="22" y2="9" stroke="#c8a060" strokeWidth="1.5"/>
      <line x1="7" y1="16" x2="9" y2="16" stroke="#c8a060" strokeWidth="1"/>
    </svg>
  )
}

const TERRAIN_SHAPES: Record<TerrainType, (size: number) => React.ReactNode> = {
  rock:  s => <RockSvg  size={s} />,
  tree:  s => <TreeSvg  size={s} />,
  water: s => <WaterSvg size={s} />,
  ruin:  s => <RuinSvg  size={s} />,
}

// ─── Forest border ────────────────────────────────────────────────────────────
// Purely decorative tree line along the left edge, right edge, and top of the
// battlefield. Uses deterministic (sin-based) offsets so the layout is stable
// across re-renders without needing game state.

// Renders a single round canopy blob for the border wall
function BlobSvg({ size, shade }: { size: number; shade: number }) {
  // shade 0–1: varies the green tone so blobs aren't uniform
  const base = Math.round(30 + shade * 20)   // 30–50 green channel
  const fill = `rgb(${18 + Math.round(shade * 8)},${base + 60},${18 + Math.round(shade * 8)})`
  const hi   = `rgb(${30 + Math.round(shade * 10)},${base + 90},${30 + Math.round(shade * 10)})`
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="10" cy="11" rx="10" ry="9"  fill={fill}/>
      <ellipse cx="10" cy="8"  rx="8"  ry="7"  fill={hi}/>
      <ellipse cx="8"  cy="6"  rx="4"  ry="3"  fill={hi} opacity="0.5"/>
    </svg>
  )
}

function ForestBorder() {
  const blobs: { key: string; top: number; left: number; size: number; shade: number }[] = []

  // Left (y≈-76) and right (y≈+76) — dense wall, step every 14 game-units
  for (const side of [-76, 76] as const) {
    for (let ex = 5; ex <= 500; ex += 14) {
      const yOff  = Math.sin(ex * 0.19 + side) * 3
      const topPct  = (1 - ex / LANE_WIDTH) * 100
      const leftPct = 50 + ((side + yOff) / 80) * 36
      const size    = 32 + Math.round(Math.abs(Math.sin(ex * 0.37 + side)) * 12)
      const shade   = (Math.sin(ex * 0.53 + side * 0.1) + 1) / 2
      blobs.push({ key: `fe-${side}-${ex}`, top: topPct, left: leftPct, size, shade })
    }
  }

  // Top edge (opponent side) — row of blobs across the width
  for (let ey = -78; ey <= 78; ey += 14) {
    const xOff  = Math.sin(ey * 0.23) * 4
    const topPct  = (1 - (492 + xOff) / LANE_WIDTH) * 100
    const leftPct = 50 + (ey / 80) * 36
    const size    = 30 + Math.round(Math.abs(Math.sin(ey * 0.41)) * 10)
    const shade   = (Math.sin(ey * 0.57) + 1) / 2
    blobs.push({ key: `fe-top-${ey}`, top: topPct, left: leftPct, size, shade })
  }

  return (
    <>
      {blobs.map(b => (
        <div
          key={b.key}
          style={{
            position: 'absolute',
            top: `${b.top}%`,
            left: `${b.left}%`,
            transform: 'translateX(-50%) translateY(-50%)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1,
          }}
        >
          <BlobSvg size={b.size} shade={b.shade} />
        </div>
      ))}
    </>
  )
}

function TerrainTile({ obs }: { obs: TerrainObstacle }) {
  const topPct  = (1 - obs.x / LANE_WIDTH) * 100
  const leftPct = 50 + (obs.y / 80) * 36
  const size    = Math.round(40 + obs.radius * 1.5)   // bigger: ~58–73 px
  return (
    <div
      className={`terrain-obstacle terrain-obstacle--${obs.type}`}
      style={{
        top:       `${topPct}%`,
        left:      `${leftPct}%`,
        transform: 'translateX(-50%) translateY(-50%)',
      }}
      title={obs.type}
    >
      {TERRAIN_SHAPES[obs.type](size)}
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
        <ForestBorder />
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
