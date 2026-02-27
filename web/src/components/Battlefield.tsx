import React, { useRef, useEffect } from 'react'
import { GameState, Unit } from '../game/types'
import { CardTile } from './CardTile'
import { hpBar } from '../game/engine'

interface Props {
  state: GameState
  onPlayCard: (cardId: string) => void
  onEndTurn: () => void
}

function UnitBadge({ unit }: { unit: Unit }) {
  const classes = [
    'unit-badge',
    `unit-badge--${unit.owner}`,
    unit.isWall ? 'unit-badge--wall' : '',
    unit.structureEffect ? 'unit-badge--structure' : '',
  ].filter(Boolean).join(' ')

  let effectLabel: string | null = null
  if (unit.structureEffect) {
    effectLabel = unit.structureEffect.type === 'mana'
      ? `+${unit.structureEffect.amount}MANA`
      : `+${unit.structureEffect.amount}DRAW`
  }

  return (
    <div className={classes}>
      <div className="unit-name">{unit.name}</div>
      <div className="unit-hp">{unit.hp}/{unit.maxHp}HP</div>
      {unit.attack > 0 && <div className="unit-atk">⚔ {unit.attack}</div>}
      {unit.isWall && <div className="unit-tag">WALL</div>}
      {unit.bypassWall && <div className="unit-tag">RANGE</div>}
      {effectLabel && <div className="unit-tag unit-tag--econ">{effectLabel}</div>}
    </div>
  )
}

export function Battlefield({ state, onPlayCard, onEndTurn }: Props) {
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

      <div className="field-divider">{'─'.repeat(44)}</div>

      {/* Player field */}
      <div className="field-row field-row--player">
        {playerUnits.length === 0
          ? <span className="field-empty">— deploy units from your hand —</span>
          : playerUnits.map(u => <UnitBadge key={u.id} unit={u} />)}
      </div>

      {/* Player base */}
      <div className="base base--player">
        <span className="base-label">YOUR BASE</span>
        <span className="base-hp">{hpBar(state.playerBase.hp, state.playerBase.maxHp)}</span>
        <span className="base-side-info">MANA: {state.mana}/{state.maxMana}</span>
      </div>

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
            HAND ({state.playerHand.length}) · Deck: {state.playerDeck.length} · Turn {state.turn}
          </span>
          <button className="action-btn end-turn-btn" onClick={onEndTurn}>
            [ End Turn ]
          </button>
        </div>
        <div className="hand-cards">
          {state.playerHand.length === 0
            ? <span className="field-empty">No cards — click End Turn</span>
            : state.playerHand.map(card => (
              <CardTile
                key={card.id}
                card={card}
                canAfford={state.mana >= card.cost}
                onClick={() => onPlayCard(card.id)}
              />
            ))}
        </div>
      </div>

    </div>
  )
}
