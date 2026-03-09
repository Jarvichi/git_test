import React from 'react'
import { loadDeck, loadCollection, deckTotalCards, isDeckValid } from '../game/collection'
import { loadRun } from '../game/questline'

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
  const deck           = loadDeck()
  const count          = deckTotalCards(deck)
  const valid          = isDeckValid(deck)
  const savedRun       = loadRun()
  const collection     = loadCollection()
  const totalOwned     = collection.reduce((s, e) => s + e.count, 0)
  const campaignUnlocked = savedRun !== null || totalOwned >= CAMPAIGN_UNLOCK_CARDS

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
        Deck: {count} cards &nbsp;·&nbsp; 💎 {crystals.toLocaleString()} crystals
      </div>
    </div>
  )
}
