import React from 'react'
import { GameState } from '../game/types'

interface Props {
  state: GameState
  winner: 'player' | 'opponent'
  onRestart: () => void
}

const VICTORY_ART = `   \\o/
    |
   / \\
=========
 VICTORY!
=========`

const DEFEAT_ART = `   ___
  | R |
  | I |
  | P |
  |___|
 /     \\`

export function GameOver({ state, winner, onRestart }: Props) {
  const won = winner === 'player'
  return (
    <div className={`gameover-screen ${won ? 'gameover--win' : 'gameover--lose'}`}>
      <div className="gameover-title">
        {won ? '═══ VICTORY ═══' : '═══ DEFEAT ═══'}
      </div>
      <pre className="gameover-ascii">{won ? VICTORY_ART : DEFEAT_ART}</pre>
      <div className="gameover-message">
        {won ? 'Enemy base destroyed!' : 'Your base was destroyed...'}
      </div>
      <div className="gameover-stats">
        <div>Turns: {state.turn}</div>
        {won
          ? <div>Your base HP: {state.playerBase.hp}/{state.playerBase.maxHp}</div>
          : <div>Enemy base HP remaining: {state.opponentBase.hp}/{state.opponentBase.maxHp}</div>}
      </div>
      <button className="action-btn action-btn--large" onClick={onRestart}>
        [ Play Again ]
      </button>
    </div>
  )
}
