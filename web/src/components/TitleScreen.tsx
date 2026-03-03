import React from 'react'
import { loadDeck, deckTotalCards, isDeckValid } from '../game/collection'

interface Props {
  crystals: number
  onPlay: () => void
  onCollection: () => void
  onDeckBuilder: () => void
}

const LOGO = `
   ____  ____  ____  __  __
  |    ||    ||  _ \|  \/  |
  |  | ||  | || |_) | |\/| |
  |  | ||  | ||  _ <| |  | |
  |____||____||_| \_\_|  |_|`.trim()

export function TitleScreen({ crystals, onPlay, onCollection, onDeckBuilder }: Props) {
  const deck  = loadDeck()
  const count = deckTotalCards(deck)
  const valid = isDeckValid(deck)

  return (
    <div className="title-screen">
      <pre className="title-logo">{LOGO}</pre>
      <div className="title-subtitle">AMAZING WEB GAME</div>

      <div className="title-buttons">
        <button
          className="action-btn action-btn--large title-play-btn"
          onClick={onPlay}
          disabled={!valid}
          title={valid ? undefined : `Deck needs ${10 - count} more cards`}
        >
          {valid ? '▶  BATTLE' : `⚠ DECK TOO SMALL (${count}/10)`}
        </button>

        <button className="action-btn title-nav-btn" onClick={onDeckBuilder}>
          DECK BUILDER
        </button>

        <button className="action-btn title-nav-btn" onClick={onCollection}>
          COLLECTION
        </button>
      </div>

      <div className="title-deck-info">
        Deck: {count} cards &nbsp;·&nbsp; 💎 {crystals.toLocaleString()} crystals
      </div>
    </div>
  )
}
