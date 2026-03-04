import React from 'react'
import { DeckEntry, STARTER_PACK_OPTIONS } from '../game/collection'
import { getCardCatalog } from '../game/cards'

interface Props {
  onPick: (cards: DeckEntry[]) => void
}

export function StarterPackSelect({ onPick }: Props) {
  const catalog = getCardCatalog()

  return (
    <div className="starter-select">
      <div className="starter-select-header">
        <div className="starter-select-title">DECK RESET</div>
        <div className="starter-select-sub">
          Your deck returns to basics. Choose a starter kit for the next act.<br />
          Your collection and mastery carry forward untouched.
        </div>
      </div>

      <div className="starter-packs">
        {STARTER_PACK_OPTIONS.map(pack => (
          <div key={pack.id} className="starter-pack" onClick={() => onPick(pack.cards)}>
            <div className="starter-pack-name">{pack.name}</div>
            <div className="starter-pack-desc">{pack.description}</div>
            <ul className="starter-pack-list">
              {pack.cards.map(entry => {
                const card = catalog.find(c => c.name === entry.cardName)
                return (
                  <li key={entry.cardName} className={`spl-item spl-item--${card?.rarity ?? 'common'}`}>
                    <span className="spl-count">×{entry.count}</span>
                    <span className="spl-name">{entry.cardName}</span>
                  </li>
                )
              })}
            </ul>
            <button className="action-btn starter-pack-btn">CHOOSE</button>
          </div>
        ))}
      </div>
    </div>
  )
}
