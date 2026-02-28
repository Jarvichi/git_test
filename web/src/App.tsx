import React, { useState, useCallback, useEffect } from 'react'
import { GameState } from './game/types'
import { newGame, playCard, tick } from './game/engine'
import { Battlefield } from './components/Battlefield'
import { GameOver } from './components/GameOver'
import './styles.css'

const TICK_MS = 100

export default function App() {
  const [state, setState] = useState<GameState>(newGame)

  useEffect(() => {
    if (state.phase.type === 'gameOver') return
    const id = setInterval(() => {
      setState(s => tick(s, TICK_MS))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [state.phase.type])

  const handlePlayCard = useCallback((cardId: string) => {
    setState(s => playCard(s, cardId))
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
        <Battlefield state={state} onPlayCard={handlePlayCard} />
      )}
    </div>
  )
}
