import React, { useRef, useEffect } from 'react'
import { GameState, Unit, LANE_WIDTH } from '../game/types'
import { CARD_COOLDOWN_MS } from '../game/engine'
import { CardTile } from './CardTile'
import { SpriteImg } from './SpriteImg'

interface Props {
  state: GameState
  onPlayCard: (cardId: string) => void
}

function LaneUnit({ unit, stackIndex = 0 }: { unit: Unit; stackIndex?: number }) {
  const hpPct = Math.max(0, (unit.hp / unit.maxHp) * 100)
  const isStructure = unit.moveSpeed === 0

  // Vertical lane: top% based on x position (high x = near enemy = near top)
  const topPct = (1 - unit.x / LANE_WIDTH) * 100

  // Unit just attacked if timer is in the upper half of its cooldown
  const isAttacking = unit.attack > 0 && unit.attackCooldownMs > 0 &&
    unit.attackTimer > unit.attackCooldownMs * 0.6

  let style: React.CSSProperties
  if (unit.isWall) {
    // Walls span the full lane width, positioned by their x value
    style = { top: `${topPct}%`, left: 0, right: 0, transform: 'translateY(-50%)' }
  } else if (isStructure) {
    // Other structures are anchored to their base edge, spread horizontally by stackIndex
    const hOffset = 5 + stackIndex * 58
    style = unit.owner === 'player'
      ? { bottom: '5px', left: `${hOffset}px` }
      : { top: '5px', right: `${hOffset}px` }
  } else {
    // Mobile units float in the center, positioned vertically
    style = {
      top: `${topPct}%`,
      left: '50%',
      transform: 'translateX(-50%) translateY(-50%)',
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
      <SpriteImg name={unit.name} className="lane-unit-sprite" />
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

export function Battlefield({ state, onPlayCard }: Props) {
  const logRef = useRef<HTMLDivElement>(null)
  const cooldownActive = state.cardCooldown > 0
  const cooldownSec = (state.cardCooldown / 1000).toFixed(1)
  const gameTimeSec = Math.floor(state.gameTime / 1000)
  const minutes = Math.floor(gameTimeSec / 60)
  const seconds = gameTimeSec % 60
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`
  const sdSec = Math.ceil(state.suddenDeathTimer / 1000)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [state.log])

  return (
    <div className="battlefield">

      {/* Top bar: clock, scores, sudden death */}
      <div className={`top-bar${state.suddenDeath ? ' top-bar--sudden-death' : ''}`}>
        <span className="game-clock">{timeStr}</span>
        <span className="score-display">
          <span className="score-player">{state.playerScore}</span>
          <span className="score-sep"> – </span>
          <span className="score-opponent">{state.opponentScore}</span>
        </span>
        {state.suddenDeath
          ? <span className="sudden-death-label">⚡ {sdSec}s</span>
          : cooldownActive
            ? <span className="cooldown-label">{cooldownSec}s</span>
            : null}
      </div>

      {/* Opponent base */}
      <div className="base-bar base-bar--opponent">
        <span className="base-bar-label">ENEMY</span>
        <HpBar current={state.opponentBase.hp} max={state.opponentBase.maxHp} color="#ff4444" />
        <span className="base-bar-info">Hand: {state.opponentHand.length}</span>
      </div>

      {/* The Lane — vertical, fills remaining space */}
      <div className="lane">
        <div className="lane-ground" />
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

      {/* Cooldown progress bar */}
      {cooldownActive && (
        <div className="cooldown-bar-track">
          <div
            className="cooldown-bar-fill"
            style={{ width: `${(state.cardCooldown / CARD_COOLDOWN_MS) * 100}%` }}
          />
        </div>
      )}

      {/* Combat log */}
      <div className="combat-log" ref={logRef}>
        {state.log.slice(-6).map((entry, i) => (
          <div key={i} className="log-entry">{entry}</div>
        ))}
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
              <CardTile
                key={card.id}
                card={card}
                canAfford={state.mana >= card.cost}
                disabled={cooldownActive}
                onClick={() => onPlayCard(card.id)}
              />
            ))}
        </div>
      </div>
    </div>
  )
}
