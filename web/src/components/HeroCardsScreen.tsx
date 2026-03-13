import React, { useState } from 'react'
import { HERO_CARDS } from '../game/cards'
import { Card } from '../game/types'
import { CardTile } from './CardTile'
import { CardDetailModal } from './CardDetailModal'

interface Props {
  onBack: () => void
}

export function HeroCardsScreen({ onBack }: Props) {
  const [detailCard, setDetailCard] = useState<Card | null>(null)

  return (
    <div className="overlay-screen">
      <div className="overlay-header">
        <button className="action-btn" onClick={onBack}>← BACK</button>
        <span className="overlay-title">🦸 HERO CARDS</span> 
      </div>
      <div style={{ padding: '8px 12px', color: '#888', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        One hero appears in every battle.<br/>
        Hero cards are shuffled into your deck at the start of each battle. You cannot choose which hero appears — fate decides.
      </div>
      <div className="collection-grid" style={{ padding: '12px' }}>
        {HERO_CARDS.map(card => (
          <div key={card.id} className="collection-cell">
            <CardTile
              card={card}
              canAfford={true}
              onClick={() => setDetailCard(card)}
            />
            <div className="cell-footer">
              <span className="cell-count" style={{ color: '#ffd700', fontSize: '10px' }}>HERO</span>
              <button
                className="extra-btn cdm-info-btn"
                onClick={() => setDetailCard(card)}
                title="Card details"
              >ⓘ</button>
            </div>
          </div>
        ))}
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
