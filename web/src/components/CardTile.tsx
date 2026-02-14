import React from 'react'
import { Card } from '../game/types'
import { effectDescription, effectLabel, rarityStars } from '../game/cards'

interface Props {
  card: Card
  showSideA: boolean
  isSelected?: boolean
  onClick?: () => void
}

export function CardTile({ card, showSideA, isSelected, onClick }: Props) {
  const effect = showSideA ? card.sideA : card.sideB
  const label = effectLabel(effect)
  const desc = effectDescription(effect)
  const stars = rarityStars(card.rarity)

  const rarityClass = `card-tile--${card.rarity}`

  return (
    <div
      className={`card-tile ${isSelected ? 'card-tile--selected' : ''} ${rarityClass}`}
      onClick={onClick}
    >
      <pre className="card-ascii">
{`┌───────┐
│ ${label}   │
│       │
│${desc.padEnd(7)}│
│       │
│ ${stars.padEnd(5)} │
└───────┘`}
      </pre>
      <div className="card-both-sides">
        {effectDescription(card.sideA)} / {effectDescription(card.sideB)}
      </div>
      <div className="card-name">{card.name}</div>
    </div>
  )
}
