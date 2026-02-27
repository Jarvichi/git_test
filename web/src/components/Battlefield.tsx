import React, { useRef, useEffect } from 'react'
import { GameState, Unit, QueuedCard } from '../game/types'
import { CardTile } from './CardTile'
import { hpBar, COMBAT_INTERVAL_MS } from '../game/engine'

interface Props {
  state: GameState
  onQueueCard: (cardId: string) => void
}

function UnitBadge({ unit }: { unit: Unit }) {
  const classes = [
    'unit-badge',
    `unit-badge--${unit.owner}`,
    unit.isWall ? 'unit-badge--wall' : '',
    unit.structureEffect ? 'unit-badge--structure' : '',
    unit.isNew ? `unit-badge--new-${unit.owner}` : '',
  ].filter(Boolean).join(' ')

  let effectLabel: string | null = null
  if (unit.structureEffect) {
    if (unit.structureEffect.type === 'mana') {
      effectLabel = `+${unit.structureEffect.amount}MANA`
    } else if (unit.structureEffect.type === 'spawn') {
      const secLeft = unit.spawnTimer != null ? Math.ceil(unit.spawnTimer / 1000) : '?'
      effectLabel = `SPAWN ${secLeft}s`
    }
  }

  return (
    <div className={classes}>
      <div className="unit-name">{unit.name}</div>
      <div className="unit-hp">{unit.hp}/{unit.maxHp}HP</div>
      {unit.attack > 0 && <div className="unit-atk">⚔ {unit.attack}</div>}
      {unit.isWall && <div className="unit-tag">WALL</div>}
      {unit.bypassWall && !unit.structureEffect && <div className="unit-tag">RANGE</div>}
      {effectLabel && <div className="unit-tag unit-tag--econ">{effectLabel}</div>}
    </div>
  )
}

function QueueBadge({ qc }: { qc: QueuedCard }) {
  const pct = Math.max(0, qc.msRemaining / qc.totalMs)
  const secLeft = Math.ceil(qc.msRemaining / 1000)
  return (
    <div className="queue-badge">
      <div className="queue-badge-name">{qc.card.name}</div>
      <div className="queue-badge-timer">{secLeft}s</div>
      <div className="queue-progress-track">
        <div className="queue-progress-fill" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  )
}

function CombatDivider({ combatTimer }: { combatTimer: number }) {
  const secsLeft = (combatTimer / 1000).toFixed(1)
  const pct = combatTimer / COMBAT_INTERVAL_MS
  return (
    <div className="field-divider-wrap">
      <div className="field-divider-bar">
        <div className="field-divider-fill" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="field-divider-label">⚔ COMBAT IN {secsLeft}s</div>
    </div>
  )
}

function ManaBar({ mana, maxMana, manaAccum }: { mana: number; maxMana: number; manaAccum: number }) {
  // Render pips: filled, partially filling, empty
  const pips = Array.from({ length: maxMana }, (_, i) => {
    if (i < mana) return 'full'
    if (i === mana) return 'partial'
    return 'empty'
  })
  return (
    <div className="mana-bar">
      {pips.map((state, i) => (
        <span key={i} className={`mana-pip mana-pip--${state}`}>
          {state === 'partial'
            ? <span className="mana-pip-fill" style={{ width: `${manaAccum * 100}%` }} />
            : null}
        </span>
      ))}
    </div>
  )
}

export function Battlefield({ state, onQueueCard }: Props) {
  const playerUnits = state.field.filter(u => u.owner === 'player')
  const opponentUnits = state.field.filter(u => u.owner === 'opponent')
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [state.log])

  return (
    <div className="battlefield">

      {/* Opponent base */}
      <div className="base base--opponent">
        <span className="base-label">ENEMY BASE</span>
        <span className="base-hp">{hpBar(state.opponentBase.hp, state.opponentBase.maxHp)}</span>
        <span className="base-side-info">Hand: {state.opponentHand.length}</span>
      </div>

      {/* Opponent field */}
      <div className="field-row field-row--opponent">
        {opponentUnits.length === 0
          ? <span className="field-empty">— no units —</span>
          : opponentUnits.map(u => <UnitBadge key={u.id} unit={u} />)}
      </div>

      {/* Combat divider with countdown */}
      <CombatDivider combatTimer={state.combatTimer} />

      {/* Player field */}
      <div className="field-row field-row--player">
        {playerUnits.length === 0
          ? <span className="field-empty">— tap cards below to deploy —</span>
          : playerUnits.map(u => <UnitBadge key={u.id} unit={u} />)}
      </div>

      {/* Player base + mana */}
      <div className="base base--player">
        <span className="base-label">YOUR BASE</span>
        <span className="base-hp">{hpBar(state.playerBase.hp, state.playerBase.maxHp)}</span>
        <span className="base-side-info">
          MANA {state.mana}/{state.maxMana}
          <ManaBar mana={state.mana} maxMana={state.maxMana} manaAccum={state.manaAccum} />
        </span>
      </div>

      {/* Deploy queue */}
      {state.queue.length > 0 && (
        <div className="queue-panel">
          <span className="queue-label">MARCHING TO FRONT:</span>
          <div className="queue-list">
            {state.queue.map(qc => <QueueBadge key={qc.qId} qc={qc} />)}
          </div>
        </div>
      )}

      {/* Combat log */}
      <div className="combat-log" ref={logRef}>
        {state.log.slice(-12).map((entry, i) => (
          <div key={i} className="log-entry">{entry}</div>
        ))}
      </div>

      {/* Hand */}
      <div className="hand-panel">
        <div className="hand-header">
          <span className="hand-label">
            HAND ({state.playerHand.length}) · Deck: {state.playerDeck.length} · Round {state.turn}
          </span>
        </div>
        <div className="hand-cards">
          {state.playerHand.length === 0
            ? <span className="field-empty">— waiting for cards —</span>
            : state.playerHand.map(card => (
              <CardTile
                key={card.id}
                card={card}
                canAfford={state.mana >= card.cost}
                onClick={() => onQueueCard(card.id)}
              />
            ))}
        </div>
      </div>

    </div>
  )
}
