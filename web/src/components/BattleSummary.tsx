import React from 'react'
import { BattleStats } from '../game/types'

interface Props {
  stats: BattleStats
  gameTime: number       // ms elapsed
  playerScore: number    // cumulative damage dealt to opponent base
  onContinue: () => void
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

export function BattleSummary({ stats, gameTime, playerScore, onContinue }: Props) {
  // Sort cards played: descending by count, take top 5
  const topCards = Object.entries(stats.cardsPlayed)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const totalCards = Object.values(stats.cardsPlayed).reduce((a, b) => a + b, 0)

  return (
    <div className="bsummary-backdrop">
      <div className="bsummary-panel">
        <div className="bsummary-title">— BATTLE COMPLETE —</div>

        <div className="bsummary-stats">
          <div className="bsummary-row">
            <span className="bsummary-label">UNITS DEFEATED</span>
            <span className="bsummary-value">{stats.playerKills}</span>
          </div>
          <div className="bsummary-row">
            <span className="bsummary-label">UNITS LOST</span>
            <span className="bsummary-value">{stats.playerUnitsLost}</span>
          </div>
          <div className="bsummary-row">
            <span className="bsummary-label">DAMAGE DEALT</span>
            <span className="bsummary-value">{playerScore}</span>
          </div>
          <div className="bsummary-row">
            <span className="bsummary-label">DURATION</span>
            <span className="bsummary-value">{formatDuration(gameTime)}</span>
          </div>
          <div className="bsummary-row">
            <span className="bsummary-label">CARDS PLAYED</span>
            <span className="bsummary-value">{totalCards}</span>
          </div>
        </div>

        {topCards.length > 0 && (
          <div className="bsummary-cards">
            <div className="bsummary-cards-label">TOP CARDS</div>
            {topCards.map(([name, count]) => (
              <div key={name} className="bsummary-card-row">
                <span className="bsummary-card-name">{name}</span>
                <span className="bsummary-card-count">×{count}</span>
              </div>
            ))}
          </div>
        )}

        <button className="action-btn action-btn--large bsummary-continue" onClick={onContinue}>
          CLAIM REWARD →
        </button>
      </div>
    </div>
  )
}
