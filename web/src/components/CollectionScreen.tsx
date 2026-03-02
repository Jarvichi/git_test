import React, { useState } from 'react'
import { CardRarity, CardType } from '../game/types'
import { getCardCatalog } from '../game/cards'
import {
  loadCollection,
  getOwnedCount,
  CollectionEntry,
} from '../game/collection'
import { CardTile } from './CardTile'

interface Props {
  onBack: () => void
}

type RarityFilter = 'all' | CardRarity
type TypeFilter   = 'all' | CardType

export function CollectionScreen({ onBack }: Props) {
  const catalog = getCardCatalog()
  const [collection, _setCollection] = useState<CollectionEntry[]>(loadCollection)

  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>('all')
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')

  const filtered = catalog.filter(c =>
    (typeFilter   === 'all' || c.cardType === typeFilter) &&
    (rarityFilter === 'all' || c.rarity   === rarityFilter)
  )

  const totalOwned = collection.reduce((s, e) => s + e.count, 0)

  return (
    <div className="overlay-screen">
      <div className="overlay-header">
        <button className="action-btn" onClick={onBack}>← BACK</button>
        <span className="overlay-title">COLLECTION</span>
        <span className="overlay-count">{totalOwned} cards owned</span>
      </div>

      <div className="filter-bar">
        <span className="filter-label">TYPE:</span>
        {(['all', 'unit', 'structure', 'upgrade'] as const).map(t => (
          <button
            key={t}
            className={`filter-btn${typeFilter === t ? ' filter-btn--active' : ''}`}
            onClick={() => setTypeFilter(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
        <span className="filter-label filter-label--spaced">RARITY:</span>
        {(['all', 'common', 'uncommon', 'rare', 'legendary'] as const).map(r => (
          <button
            key={r}
            className={`filter-btn${rarityFilter === r ? ' filter-btn--active' : ''}`}
            onClick={() => setRarityFilter(r)}
          >
            {r === 'all' ? 'ALL' : r.slice(0, 3).toUpperCase()}
          </button>
        ))}
      </div>

      <div className="collection-grid">
        {filtered.map(card => {
          const owned = getOwnedCount(collection, card.name)
          return (
            <div key={card.name} className={`collection-cell${owned === 0 ? ' collection-cell--unowned' : ''}`}>
              <CardTile card={card} canAfford={false} disabled={false} />
              <div className="collection-badge">×{owned}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
