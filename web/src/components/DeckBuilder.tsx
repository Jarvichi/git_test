import React, { useState } from 'react'
import { Card } from '../game/types'
import { getCardCatalog } from '../game/cards'
import {
  loadCollection,
  loadDeck,
  saveDeck,
  deckTotalCards,
  isDeckValid,
  getOwnedCount,
  getMasteryXp,
  masteryLevel,
  DECK_MIN,
  DECK_MAX,
  COPIES_MAX,
  CollectionEntry,
  DeckEntry,
} from '../game/collection'
import { CardTile } from './CardTile'
import { CardDetailModal } from './CardDetailModal'

interface Props {
  onBack: () => void
}

export function DeckBuilder({ onBack }: Props) {
  const catalog = getCardCatalog()
  const [collection] = useState<CollectionEntry[]>(loadCollection)
  const [deck, setDeck] = useState<DeckEntry[]>(loadDeck)
  const [detailCard, setDetailCard] = useState<Card | null>(null)

  const total = deckTotalCards(deck)
  const valid = isDeckValid(deck)

  function inDeckCount(name: string): number {
    return deck.find(e => e.cardName === name)?.count ?? 0
  }

  function addCard(name: string) {
    const owned = getOwnedCount(collection, name)
    const inDeck = inDeckCount(name)
    if (inDeck >= Math.min(owned, COPIES_MAX)) return
    if (total >= DECK_MAX) return
    setDeck(prev => {
      const idx = prev.findIndex(e => e.cardName === name)
      if (idx === -1) return [...prev, { cardName: name, count: 1 }]
      const next = [...prev]
      next[idx] = { ...next[idx], count: next[idx].count + 1 }
      return next
    })
  }

  function removeCard(name: string) {
    setDeck(prev => {
      const idx = prev.findIndex(e => e.cardName === name)
      if (idx === -1) return prev
      const next = [...prev]
      if (next[idx].count <= 1) {
        next.splice(idx, 1)
      } else {
        next[idx] = { ...next[idx], count: next[idx].count - 1 }
      }
      return next
    })
  }

  function handleSave() {
    saveDeck(deck)
    onBack()
  }

  // Only show cards the player owns
  const ownedCards = catalog.filter(c => getOwnedCount(collection, c.name) > 0)

  // Deck list sorted by cost then name
  const deckList = [...deck].sort((a, b) => {
    const ca = catalog.find(c => c.name === a.cardName)!
    const cb = catalog.find(c => c.name === b.cardName)!
    return ca.cost - cb.cost || a.cardName.localeCompare(b.cardName)
  })

  return (
    <div className="overlay-screen">
      <div className="overlay-header">
        <button className="action-btn" onClick={onBack}>← BACK</button>
        <span className="overlay-title">DECK BUILDER</span>
        <span className={`overlay-count${valid ? ' overlay-count--valid' : ' overlay-count--invalid'}`}>
          {total}/{DECK_MAX} cards
          {total < DECK_MIN && ` (need ${DECK_MIN - total} more)`}
        </span>
      </div>

      <div className="deckbuilder-body">
        {/* ── Left: collection ── */}
        <div className="deckbuilder-collection">
          <div className="deckbuilder-panel-title">YOUR CARDS — click to add</div>
          <div className="collection-grid">
            {ownedCards.map(card => {
              const owned  = getOwnedCount(collection, card.name)
              const inDeck = inDeckCount(card.name)
              const canAdd = inDeck < Math.min(owned, COPIES_MAX) && total < DECK_MAX
              const lvl    = masteryLevel(getMasteryXp(collection, card.name))
              return (
                <div key={card.name} className="collection-cell">
                  <CardTile
                    card={card}
                    canAfford={canAdd}
                    onClick={canAdd ? () => addCard(card.name) : undefined}
                  />
                  <div className="cell-footer">
                    <span className="cell-count">
                      {inDeck}/{owned}
                      {lvl > 0 && <span className="cell-mastery-badge">★{lvl}</span>}
                    </span>
                    <button
                      className="extra-btn cdm-info-btn"
                      onClick={e => { e.stopPropagation(); setDetailCard(card) }}
                      title="Card details"
                    >ⓘ</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right: current deck ── */}
        <div className="deckbuilder-deck">
          <div className="deckbuilder-panel-title">DECK — click to remove</div>
          {deck.length === 0 ? (
            <div className="deck-empty">Add cards from the left.</div>
          ) : (
            <ul className="deck-list">
              {deckList.map(entry => {
                const card = catalog.find(c => c.name === entry.cardName)!
                const lvl  = masteryLevel(getMasteryXp(collection, entry.cardName))
                return (
                  <li
                    key={entry.cardName}
                    className={`deck-list-item deck-list-item--${card.rarity}`}
                    onClick={() => removeCard(entry.cardName)}
                    title="Click to remove one copy"
                  >
                    <span className="deck-list-cost">{card.cost}</span>
                    <span className="deck-list-name">{card.name}</span>
                    {lvl > 0 && <span className="deck-list-mastery">★{lvl}</span>}
                    <span className="deck-list-count">×{entry.count}</span>
                    <button
                      className="deck-list-info-btn"
                      onClick={e => { e.stopPropagation(); setDetailCard(card) }}
                      title="Card details"
                    >ⓘ</button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="deckbuilder-footer">
            <div className="deck-size-bar-track">
              <div
                className="deck-size-bar-fill"
                style={{ width: `${Math.min(100, (total / DECK_MAX) * 100)}%` }}
              />
            </div>
            <button
              className={`action-btn${valid ? ' action-btn--large' : ''}`}
              onClick={handleSave}
              disabled={!valid}
            >
              {valid ? '✓ SAVE DECK' : `NEED ${DECK_MIN}+ CARDS`}
            </button>
          </div>
        </div>
      </div>

      {detailCard && (
        <CardDetailModal
          card={detailCard}
          collection={collection}
          deckEntries={deck}
          onClose={() => setDetailCard(null)}
        />
      )}
    </div>
  )
}
