import React from 'react'
import { GameState } from '../game/types'

interface Props {
  state: GameState
  won: boolean
  onRestart: () => void
}

const VICTORY_ART = `   \\o/
    |
   / \\
=========
 WINNER!
=========`

const DEFEAT_ART = `   ___
  | R |
  | I |
  | P |
  |___|
 /     \\`

export function GameOver({ state, won, onRestart }: Props) {
  return (
    <div className={`gameover-screen ${won ? 'gameover--win' : 'gameover--lose'}`}>
      <div className="gameover-title">
        {won ? '═══ VICTORY ═══' : '═══ DEFEAT ═══'}
      </div>

      <pre className="gameover-ascii">{won ? VICTORY_ART : DEFEAT_ART}</pre>

      {won ? (
        <>
          <div className="gameover-message">You defeated the Dragon Lord!</div>
          <div className="gameover-stats">
            <div>HP remaining: {state.playerHP}/{state.playerMaxHP}</div>
            <div>Cards in hand: {state.hand.length}</div>
            <div>Turns taken: {state.turnNumber}</div>
          </div>
        </>
      ) : (
        <>
          <div className="gameover-message">
            {state.playerHP <= 0 ? 'You were slain...' : 'You ran out of cards!'}
          </div>
          <div className="gameover-stats">
            <div>Reached step: {state.currentStep}/10</div>
            <div>Turns taken: {state.turnNumber}</div>
          </div>
        </>
      )}

      <button className="action-btn action-btn--large" onClick={onRestart}>
        [ Play Again ]
      </button>
    </div>
  )
}
