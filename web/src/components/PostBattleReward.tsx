import React from 'react'
import { CardTile } from './CardTile'
import { getCardCatalog } from '../game/cards'
import { NodeType } from '../game/questline'

interface Props {
  choices: string[]     // 3 card names
  nodeType: NodeType
  onPick: (cardName: string) => void
  onSkip: () => void
}

const NODE_FLAVOUR: Record<NodeType, string> = {
  battle:   'The enemy is routed. Pick a card from the spoils.',
  elite:    'A formidable foe falls. Choose your reward.',
  boss:     'The shard guardian is defeated. A legendary prize awaits.',
  rest:     '',
}

export function PostBattleReward({ choices, nodeType, onPick, onSkip }: Props) {
  const catalog = getCardCatalog()
  const cards = choices.map(name => catalog.find(c => c.name === name)).filter(Boolean) as ReturnType<typeof getCardCatalog>[number][]

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
              onClick={() => onPick(card.name)}
            />
            <div className="reward-card-label">{card.name}</div>
          </div>
        ))}
      </div>

      <button className="action-btn reward-skip-btn" onClick={onSkip}>
        SKIP REWARD
      </button>
    </div>
  )
}
