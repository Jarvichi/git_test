import React, { useState } from 'react'
import { loadDeck, loadCollection, deckTotalCards, isDeckValid } from '../game/collection'
import { loadRun } from '../game/questline'
import { getCardCatalog, HERO_CARDS } from '../game/cards'
import { Card } from '../game/types'
import { CardTile } from './CardTile'
import { CardDetailModal } from './CardDetailModal'

const CAMPAIGN_UNLOCK_CARDS = 30

interface Props {
  crystals: number
  onPlay: () => void
  onCampaign: () => void
  onCollection: () => void
  onDeckBuilder: () => void
  onSettings: () => void
  onInventory: () => void
  onAchievements: () => void
}

export function TitleScreen({ crystals, onPlay, onCampaign, onCollection, onDeckBuilder, onSettings, onInventory, onAchievements }: Props) {
  const deck             = loadDeck()
  const count            = deckTotalCards(deck)
  const valid            = isDeckValid(deck)
  const savedRun         = loadRun()
  const collection       = loadCollection()
  const totalOwned       = collection.reduce((s, e) => s + e.count, 0)
  const campaignUnlocked = savedRun !== null || totalOwned >= CAMPAIGN_UNLOCK_CARDS
  const catalog          = getCardCatalog()
  const distinctUnlocked = collection.filter(e => e.count > 0 && catalog.some(c => c.name === e.cardName)).length
  const catalogTotal     = catalog.length

  const [showHeroes, setShowHeroes]     = useState(false)
  const [detailCard, setDetailCard]     = useState<Card | null>(null)

  return (
    <div className="title-screen">
      <div className="title-logo">JARV'S</div>
      <div className="title-subtitle">AMAZING WEB GAME</div>

      <div className="title-buttons">
        <button
          className="action-btn action-btn--large title-campaign-btn"
          onClick={onCampaign}
          disabled={!valid || !campaignUnlocked}
          title={
            !valid ? `Deck needs ${10 - count} more cards` :
            !campaignUnlocked ? `Collect ${CAMPAIGN_UNLOCK_CARDS - totalOwned} more cards to unlock Campaign — play Quick Battle to earn cards!` :
            undefined
          }
        >
          {savedRun ? '⚔  CONTINUE RUN' : '⚔  CAMPAIGN'}
        </button>

        {!campaignUnlocked && (
          <div className="title-campaign-locked-hint">
            🔒 Campaign unlocks at {CAMPAIGN_UNLOCK_CARDS} cards ({totalOwned}/{CAMPAIGN_UNLOCK_CARDS}) — play Quick Battle to earn more!
          </div>
        )}

        <button
          className="action-btn title-play-btn"
          onClick={onPlay}
          disabled={!valid}
          title={valid ? undefined : `Deck needs ${10 - count} more cards`}
        >
          {valid ? '▶  QUICK BATTLE' : `⚠ DECK TOO SMALL (${count}/10)`}
        </button>

        <button className="action-btn title-nav-btn" onClick={onDeckBuilder}>
          DECK BUILDER
        </button>

        <button className="action-btn title-nav-btn" onClick={onCollection}>
          COLLECTION
        </button>

        <button className="action-btn title-nav-btn" onClick={() => setShowHeroes(true)}>
          🦸 HERO CARDS
        </button>

        <button className="action-btn title-nav-btn" onClick={onInventory}>
          🎒 INVENTORY
        </button>

        <button className="action-btn title-nav-btn" onClick={onAchievements}>
          🏆 ACHIEVEMENTS
        </button>

        <button className="action-btn title-nav-btn title-settings-btn" onClick={onSettings}>
          ⚙ SETTINGS
        </button>
      </div>

      <div className="title-deck-info">
        {distinctUnlocked}/{catalogTotal} cards &nbsp;·&nbsp; 💎 {crystals.toLocaleString()} &nbsp;·&nbsp; Deck: {count}
      </div>

      {/* Hero Cards overlay */}
      {showHeroes && (
        <div className="overlay-screen">
          <div className="overlay-header">
            <button className="action-btn" onClick={() => setShowHeroes(false)}>← BACK</button>
            <span className="overlay-title">🦸 HERO CARDS</span>
            <span style={{ color: '#888', fontSize: '12px' }}>One hero appears in every battle</span>
          </div>
          <div style={{ padding: '8px 12px', color: '#888', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            Hero cards are shuffled into your deck at the start of each battle. You cannot choose which hero appears — fate decides.
          </div>
          <div className="collection-grid" style={{ padding: '12px' }}>
            {HERO_CARDS.map(card => (
              <div key={card.id} className="collection-cell">
                <CardTile
                  card={card}
                  canAfford={false}
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
        </div>
      )}

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
