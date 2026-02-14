import React from 'react'
import { Card, GameState } from '../game/types'
import { CardTile } from './CardTile'
import { hpBar } from '../game/engine'

interface Props {
  state: GameState
  selectedCardId: string | null
  onSelectCard: (card: Card) => void
}

export function Hand({ state, selectedCardId, onSelectCard }: Props) {
  return (
    <div className="hand-panel">
      <div className="hand-stats">
        <span>{hpBar(state.playerHP, state.playerMaxHP, 'HP')}</span>
        <span>Draw:{state.drawPile.length} | Discard:{state.discardPile.length} | Hand:{state.hand.length}</span>
      </div>
      <div className="hand-label">── YOUR HAND (tap to use Side A: Movement) ──</div>
      <div className="hand-cards">
        {state.hand.map(card => (
          <CardTile
            key={card.id}
            card={card}
            showSideA={true}
            isSelected={card.id === selectedCardId}
            onClick={() => onSelectCard(card)}
          />
        ))}
      </div>
      {selectedCardId && (
        <div className="hand-hint">Card selected — pick a destination on the map above</div>
      )}
    </div>
  )
}
