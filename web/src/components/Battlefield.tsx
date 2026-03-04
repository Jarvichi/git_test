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

// ─── Lane background ──────────────────────────────────────────────────────────
// Full-size SVG rendered as the ground layer: grass, dirt path, crop rows,
// sandy patches. Uses preserveAspectRatio="none" so it always fills the lane.

function LaneBackground() {
  const cropRows = Array.from({ length: 30 }, (_, i) => i)
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
      viewBox="0 0 100 220"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base grass */}
      <rect width="100" height="220" fill="#2a5418"/>

      {/* Left crop field */}
      <rect x="0" y="0" width="24" height="220" fill="#1e4810"/>
      {cropRows.map(i => (
        <rect key={i} x="0" y={i * 7.5} width="24" height="3.5" fill="#2a5a14" opacity="0.75"/>
      ))}
      <line x1="24" y1="0" x2="24" y2="220" stroke="#3a6820" strokeWidth="0.6" opacity="0.5"/>

      {/* Right sandy / desert strip */}
      <rect x="74" y="30" width="26" height="120" fill="#7a6030" opacity="0.32"/>
      <rect x="78" y="45" width="18" height="90"  fill="#8a6c38" opacity="0.22"/>

      {/* Dirt path (slightly winding, centre ~36–64) */}
      <path d="M36,0 C34,45 38,90 35,132 C32,170 37,195 35,220 L64,220 C62,195 67,170 64,132 C61,90 65,45 63,0 Z"
        fill="#6a4820" opacity="0.72"/>
      {/* Path lighter surface */}
      <path d="M38,0 C36,44 40,88 37,130 C34,168 39,194 37,220 L62,220 C60,194 65,168 62,130 C59,88 63,44 61,0 Z"
        fill="#8a6030"/>
      {/* Worn tyre tracks */}
      <path d="M44,0 C43,38 45,80 43,122 C41,158 44,188 43,220 L49,220 C48,188 51,158 49,122 C47,80 49,38 48,0 Z"
        fill="#a07848" opacity="0.45"/>
      <path d="M52,0 C51,38 53,80 51,122 C49,158 52,188 51,220 L57,220 C56,188 59,158 57,122 C55,80 57,38 56,0 Z"
        fill="#a07848" opacity="0.45"/>

      {/* Grass tufts (mid-field) */}
      <ellipse cx="29" cy="52"  rx="7" ry="4.5" fill="#3a6820" opacity="0.5"/>
      <ellipse cx="68" cy="78"  rx="6" ry="4"   fill="#3a6820" opacity="0.45"/>
      <ellipse cx="27" cy="128" rx="8" ry="5"   fill="#3a6820" opacity="0.5"/>
      <ellipse cx="70" cy="155" rx="7" ry="4.5" fill="#3a6820" opacity="0.45"/>
      <ellipse cx="30" cy="195" rx="5" ry="3.5" fill="#3a6820" opacity="0.4"/>

      {/* Path-edge pebbles */}
      <circle cx="36" cy="42"  r="1.5" fill="#887860" opacity="0.55"/>
      <circle cx="63" cy="86"  r="1.5" fill="#887860" opacity="0.55"/>
      <circle cx="35" cy="134" r="1.5" fill="#887860" opacity="0.55"/>
      <circle cx="64" cy="178" r="1.5" fill="#887860" opacity="0.55"/>

      {/* Sandy dirt patches (right side) */}
      <ellipse cx="82" cy="52"  rx="6" ry="4" fill="#6a4820" opacity="0.38"/>
      <ellipse cx="80" cy="112" rx="5" ry="3.5" fill="#6a4820" opacity="0.32"/>
      <ellipse cx="84" cy="172" rx="6" ry="4" fill="#6a4820" opacity="0.38"/>
    </svg>
  )
}

// ─── Terrain SVG shapes ───────────────────────────────────────────────────────

function RockSvg({ size }: { size: number }) {
  // Dramatic mountain peaks — back range + front double-peak silhouette
  return (
    <svg width={size} height={Math.round(size * 1.25)} viewBox="0 0 38 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M2,46 C5,44 9,36 16,8 C23,36 27,44 30,46 Z" fill="#525258" opacity="0.65"/>
      <path d="M4,46 C7,42 11,32 17,6 L21,22 L26,4 C30,28 34,42 37,46 Z" fill="#78787e"/>
      <path d="M17,6 C16,10 15,18 14,28" fill="none" stroke="#aaaab0" strokeWidth="1" opacity="0.6"/>
      <path d="M17,6 L19,14 L21,22 L23,14 L26,4 L24,8 L21,16 L18,8 Z" fill="#d0d0d8" opacity="0.3"/>
    </svg>
  )
}

// Deciduous (organic blob cluster)
function TreeSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 28" xmlns="http://www.w3.org/2000/svg">
      <path d="M4,22 C0,18 1,11 6,9 C5,5 10,2 15,5 C18,2 24,4 24,9 C28,10 30,16 27,20 C28,24 23,27 18,25 C15,28 8,27 4,22 Z"
        fill="#1e4812" opacity="0.5"/>
      <path d="M5,20 C1,16 2,9 7,8 C6,4 11,1 16,4 C19,1 25,3 25,8 C29,9 30,15 27,19 C28,23 23,26 18,24 C15,27 7,26 5,20 Z"
        fill="#2e6018"/>
      <path d="M8,18 C5,14 6,9 10,8 C10,5 14,3 17,6 C20,4 24,7 23,11 C26,13 25,18 22,20 C21,23 17,24 14,21 C12,23 7,22 8,18 Z"
        fill="#3d7a22"/>
      <ellipse cx="15" cy="13" rx="5" ry="4" fill="#52a030" opacity="0.4"/>
    </svg>
  )
}

// Pine / conifer — tall narrow layered triangle
function PineTreeSvg({ size }: { size: number }) {
  return (
    <svg width={Math.round(size * 0.65)} height={size} viewBox="0 0 18 32" xmlns="http://www.w3.org/2000/svg">
      <polygon points="9,2 17,13 1,13"  fill="#1a4a1a"/>
      <polygon points="9,7 18,19 0,19"  fill="#1e5820"/>
      <polygon points="9,12 18,25 0,25" fill="#245c24"/>
      <polygon points="9,17 17,28 1,28" fill="#2a6628"/>
      <rect x="7" y="28" width="4" height="4" fill="#5a3010"/>
    </svg>
  )
}

// Fruit tree — round canopy with red apple dots
function FruitTreeSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="15" cy="17" rx="13" ry="10" fill="#1e4810" opacity="0.45"/>
      <ellipse cx="15" cy="15" rx="13" ry="11" fill="#2e5c18"/>
      <ellipse cx="15" cy="11" rx="10" ry="8"  fill="#3a7020"/>
      <circle cx="9"  cy="15" r="2.2" fill="#cc2020"/>
      <circle cx="18" cy="12" r="2"   fill="#dd3030"/>
      <circle cx="21" cy="17" r="2.2" fill="#cc2020"/>
      <circle cx="12" cy="19" r="2"   fill="#cc2828"/>
      <circle cx="9"  cy="15" r="0.8" fill="#ff7070" opacity="0.5"/>
      <circle cx="21" cy="17" r="0.8" fill="#ff7070" opacity="0.5"/>
      <line x1="15" y1="23" x2="14" y2="29" stroke="#5a3010" strokeWidth="2.5"/>
    </svg>
  )
}

function WaterSvg({ size }: { size: number }) {
  const w = Math.round(size * 1.7)
  return (
    <svg width={w} height={size} viewBox="0 0 52 22" xmlns="http://www.w3.org/2000/svg">
      <path d="M2,13 C0,8 3,3 9,4 C10,1 16,0 19,4 C23,2 27,6 25,11 C28,13 27,19 23,20 C20,22 14,22 11,18 C7,21 1,19 2,13 Z"
        fill="#1a3a7a"/>
      <path d="M24,12 C22,7 25,3 30,4 C32,1 38,1 40,5 C44,4 48,8 47,13 C48,17 44,21 40,20 C37,22 30,22 27,18 C24,20 23,16 24,12 Z"
        fill="#1e4490"/>
      <ellipse cx="14" cy="10" rx="5" ry="2"   fill="#5090e0" opacity="0.45"/>
      <ellipse cx="37" cy="11" rx="4" ry="1.8" fill="#5090e0" opacity="0.4"/>
    </svg>
  )
}

// Crumbled stone ruin
function RuinSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 26" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="14" cy="25" rx="12" ry="1.8" fill="#1a1a0a" opacity="0.3"/>
      <rect x="2"  y="12" width="6"  height="12" fill="#5a4a3a" stroke="#c8a060" strokeWidth="1.2"/>
      <rect x="10" y="6"  width="8"  height="18" fill="#4a3a2a" stroke="#c8a060" strokeWidth="1.2"/>
      <rect x="20" y="14" width="6"  height="10" fill="#6a5a4a" stroke="#c8a060" strokeWidth="1.2"/>
      <line x1="2"  y1="12" x2="7"  y2="4"  stroke="#c8a060" strokeWidth="1.4"/>
      <line x1="20" y1="14" x2="25" y2="8"  stroke="#c8a060" strokeWidth="1.4"/>
      <line x1="8"  y1="18" x2="10" y2="18" stroke="#c8a060" strokeWidth="1"/>
    </svg>
  )
}

// Farmhouse with barn-red roof
function FarmhouseSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 30" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="29" rx="14" ry="2" fill="#1a1a0a" opacity="0.3"/>
      <rect x="3" y="15" width="26" height="13" fill="#a08060" stroke="#c8a060" strokeWidth="1"/>
      <polygon points="1,15 16,4 31,15" fill="#8a3020" stroke="#aa4030" strokeWidth="1"/>
      <rect x="13" y="21" width="6" height="7" fill="#5a3a18" stroke="#7a5a30" strokeWidth="0.8"/>
      <circle cx="18.5" cy="24.5" r="0.8" fill="#c8a060"/>
      <rect x="4"  y="17" width="6" height="5" fill="#5888a0" stroke="#789898" strokeWidth="0.5"/>
      <rect x="22" y="17" width="6" height="5" fill="#5888a0" stroke="#789898" strokeWidth="0.5"/>
      <line x1="7"  y1="17" x2="7"  y2="22" stroke="#789898" strokeWidth="0.5"/>
      <line x1="4"  y1="19.5" x2="10" y2="19.5" stroke="#789898" strokeWidth="0.5"/>
      <line x1="25" y1="17" x2="25" y2="22" stroke="#789898" strokeWidth="0.5"/>
      <line x1="22" y1="19.5" x2="28" y2="19.5" stroke="#789898" strokeWidth="0.5"/>
    </svg>
  )
}

// Stone watchtower with battlements
function WatchtowerSvg({ size }: { size: number }) {
  return (
    <svg width={Math.round(size * 0.55)} height={size} viewBox="0 0 16 30" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="8" cy="29" rx="7" ry="1.5" fill="#1a1a0a" opacity="0.35"/>
      <rect x="2" y="10" width="12" height="18" fill="#6a5a4a" stroke="#9a8a70" strokeWidth="0.8"/>
      <line x1="2" y1="15" x2="14" y2="15" stroke="#5a4a3a" strokeWidth="0.5"/>
      <line x1="2" y1="20" x2="14" y2="20" stroke="#5a4a3a" strokeWidth="0.5"/>
      <line x1="2" y1="25" x2="14" y2="25" stroke="#5a4a3a" strokeWidth="0.5"/>
      <rect x="0"  y="6"  width="4" height="5" fill="#7a6a5a" stroke="#9a8a70" strokeWidth="0.8"/>
      <rect x="6"  y="6"  width="4" height="5" fill="#7a6a5a" stroke="#9a8a70" strokeWidth="0.8"/>
      <rect x="12" y="6"  width="4" height="5" fill="#7a6a5a" stroke="#9a8a70" strokeWidth="0.8"/>
      <rect x="7"  y="15" width="2" height="6" fill="#1a1a1a"/>
      <path d="M1,28 C1,26 3,25 8,25 C13,25 15,26 15,28 L14,29 L2,29 Z" fill="#5a4a3a"/>
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

  // Left (y≈-84) and right (y≈+84) — tight wall just outside the playable field
  for (const side of [-84, 84] as const) {
    for (let ex = 5; ex <= 500; ex += 16) {
      const yOff  = Math.sin(ex * 0.19 + side) * 2      // ±2 units jitter
      const topPct  = (1 - ex / LANE_WIDTH) * 100
      const leftPct = 50 + ((side + yOff) / 80) * 36
      const size    = 20 + Math.round(Math.abs(Math.sin(ex * 0.37 + side)) * 8)
      const shade   = (Math.sin(ex * 0.53 + side * 0.1) + 1) / 2
      blobs.push({ key: `fe-${side}-${ex}`, top: topPct, left: leftPct, size, shade })
    }
  }

  // Top edge (opponent side)
  for (let ey = -84; ey <= 84; ey += 16) {
    const xOff  = Math.sin(ey * 0.23) * 3
    const topPct  = (1 - (495 + xOff) / LANE_WIDTH) * 100
    const leftPct = 50 + (ey / 80) * 36
    const size    = 20 + Math.round(Math.abs(Math.sin(ey * 0.41)) * 8)
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

// Bridge shown over large water obstacles (radius > 18)
function BridgeSvg({ size }: { size: number }) {
  const w = Math.round(size * 1.7)  // match WaterSvg width
  return (
    <svg width={w} height={Math.round(size * 0.5)} viewBox="0 0 52 11" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', top: '25%', left: 0, pointerEvents: 'none' }}>
      {/* Bridge deck planks */}
      <rect x="0"  y="4" width="52" height="4" fill="#8a6a3a"/>
      <line x1="6"  y1="4" x2="6"  y2="8" stroke="#6a4a22" strokeWidth="1.2"/>
      <line x1="14" y1="4" x2="14" y2="8" stroke="#6a4a22" strokeWidth="1.2"/>
      <line x1="22" y1="4" x2="22" y2="8" stroke="#6a4a22" strokeWidth="1.2"/>
      <line x1="30" y1="4" x2="30" y2="8" stroke="#6a4a22" strokeWidth="1.2"/>
      <line x1="38" y1="4" x2="38" y2="8" stroke="#6a4a22" strokeWidth="1.2"/>
      <line x1="46" y1="4" x2="46" y2="8" stroke="#6a4a22" strokeWidth="1.2"/>
      {/* Railings */}
      <line x1="0" y1="3" x2="52" y2="3" stroke="#c8a060" strokeWidth="1.5"/>
      <line x1="0" y1="9" x2="52" y2="9" stroke="#c8a060" strokeWidth="1.5"/>
      {/* Posts */}
      {[4, 14, 24, 34, 44].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="11" stroke="#c8a060" strokeWidth="1.5"/>
      ))}
    </svg>
  )
}

function TerrainTile({ obs }: { obs: TerrainObstacle }) {
  const topPct  = (1 - obs.x / LANE_WIDTH) * 100
  const leftPct = 50 + (obs.y / 80) * 36
  // Visual size tracks the physical radius so the obstacle looks as large as it blocks
  const size    = Math.round(obs.radius * 2.8)   // radius 20–32 → 56–90 px
  const hasBridge = obs.type === 'water' && obs.radius > 26

  // Deterministic variant from obstacle id (0, 1, 2)
  const variant = parseInt(obs.id.replace('t', ''), 10) % 3

  let shape: React.ReactNode
  if (obs.type === 'tree') {
    shape = variant === 0 ? <PineTreeSvg  size={size} />
          : variant === 1 ? <FruitTreeSvg size={size} />
          :                 <TreeSvg      size={size} />
  } else if (obs.type === 'ruin') {
    shape = variant === 0 ? <RuinSvg       size={size} />
          : variant === 1 ? <FarmhouseSvg  size={size} />
          :                 <WatchtowerSvg size={size} />
  } else {
    shape = TERRAIN_SHAPES[obs.type](size)
  }

  return (
    <div
      className={`terrain-obstacle terrain-obstacle--${obs.type}`}
      style={{
        top:       `${topPct}%`,
        left:      `${leftPct}%`,
        transform: 'translateX(-50%) translateY(-50%)',
        overflow:  'visible',
        position:  'absolute',
        zIndex:    3,
      }}
      title={obs.type}
    >
      {shape}
      {hasBridge && <BridgeSvg size={size} />}
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
        <LaneBackground />
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
