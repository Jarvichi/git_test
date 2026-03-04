import React from 'react'
import { loadDeck, deckTotalCards, isDeckValid } from '../game/collection'
import { loadRun } from '../game/questline'

interface Props {
  crystals: number
  onPlay: () => void
  onCampaign: () => void
  onCollection: () => void
  onDeckBuilder: () => void
  onSettings: () => void
}

export function TitleScreen({ crystals, onPlay, onCampaign, onCollection, onDeckBuilder, onSettings }: Props) {
  const deck     = loadDeck()
  const count    = deckTotalCards(deck)
  const valid    = isDeckValid(deck)
  const savedRun = loadRun()

  return (
    <div className="title-screen">
      <div className="title-logo">JARV'S</div>
      <div className="title-subtitle">AMAZING WEB GAME</div>

      <div className="title-buttons">
        <button
          className="action-btn action-btn--large title-campaign-btn"
          onClick={onCampaign}
          disabled={!valid}
          title={valid ? undefined : `Deck needs ${10 - count} more cards`}
        >
          {savedRun ? '⚔  CONTINUE RUN' : '⚔  CAMPAIGN'}
        </button>

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

        <button className="action-btn title-nav-btn" onClick={onSettings}
          style={{ fontSize: '11px', color: '#888', borderColor: 'rgba(51,255,51,0.25)' }}
        >
          ⚙ SETTINGS
        </button>
      </div>

      <div className="title-deck-info">
        Deck: {count} cards &nbsp;·&nbsp; 💎 {crystals.toLocaleString()} crystals
      </div>
    </div>
  )
}
