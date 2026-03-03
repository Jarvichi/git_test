import React, { useState } from 'react'
import { Card } from '../game/types'
import { CardTile } from './CardTile'
import { CardDetailModal } from './CardDetailModal'
import { getCardCatalog } from '../game/cards'
import { NodeType } from '../game/questline'

interface Props {
  choices: string[]     // 3 card names
  nodeType: NodeType
  onPick: (cardName: string) => void
  onSkip: () => void
}

const NODE_FLAVOUR: Record<NodeType, string> = {
  battle:   'Tap a card to inspect · pick from its detail view.',
  elite:    'A formidable foe falls. Tap to inspect your reward.',
  boss:     'The shard guardian is defeated. Tap to inspect your prize.',
  rest:     '',
}

export function PostBattleReward({ choices, nodeType, onPick, onSkip }: Props) {
  const catalog = getCardCatalog()
  const cards = choices.map(name => catalog.find(c => c.name === name)).filter(Boolean) as ReturnType<typeof getCardCatalog>[number][]
  const [detailCard, setDetailCard] = useState<Card | null>(null)

  return (
    <div className="reward-screen">
      <div className="reward-header">
        <div className="reward-title">VICTORY</div>
        <div className="reward-sub">{NODE_FLAVOUR[nodeType]}</div>
      </div>

      <div className="reward-cards">
        {cards.map(card => (
          <div key={card.name} className="reward-card-wrap">
            <CardTile
              card={card}
              canAfford={true}
              onClick={() => setDetailCard(card)}
            />
          </div>
        ))}
      </div>

      <button className="action-btn reward-skip-btn" onClick={onSkip}>
        SKIP REWARD
      </button>

      {detailCard && (
        <CardDetailModal
          card={detailCard}
          collection={[]}
          onClose={() => setDetailCard(null)}
          onPick={() => { onPick(detailCard.name); setDetailCard(null) }}
        />
      )}
    </div>
  )
}
