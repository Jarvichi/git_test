import React, { useState, useCallback } from 'react'
import { GameState } from './game/types'
import { newGame, playCard, endTurn } from './game/engine'
import { Battlefield } from './components/Battlefield'
import { GameOver } from './components/GameOver'
import './styles.css'

export default function App() {
  const [state, setState] = useState<GameState>(newGame)

  const handlePlayCard = useCallback((cardId: string) => {
    setState(s => playCard(s, cardId))
  }, [])

  const handleEndTurn = useCallback(() => {
    setState(s => endTurn(s))
  }, [])

  const handleRestart = useCallback(() => {
    setState(newGame())
  }, [])

  return (
    <div className="game-container">
      <div className="game-title">JARV'S AMAZING WEB GAME</div>
      {state.phase.type === 'gameOver' ? (
        <GameOver state={state} winner={state.phase.winner} onRestart={handleRestart} />
      ) : (
        <Battlefield state={state} onPlayCard={handlePlayCard} onEndTurn={handleEndTurn} />
      )}
    </div>
  )
}
