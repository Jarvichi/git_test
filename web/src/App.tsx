import React, { useState, useCallback } from 'react'
import { Card, GameState } from './game/types'
import {
  newGame,
  resolveMovementTargets,
  playCardForMovement,
  playCardForCombat,
  collectReward,
  collectBattleReward,
  skipBattleReward,
} from './game/engine'
import { PathMap } from './components/PathMap'
import { Hand } from './components/Hand'
import { Battle } from './components/Battle'
import { Reward } from './components/Reward'
import { BattleReward } from './components/BattleReward'
import { GameOver } from './components/GameOver'
import './styles.css'

export default function App() {
  const [state, setState] = useState<GameState>(newGame)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [movementTargets, setMovementTargets] = useState<string[]>([])

  const handleSelectMovementCard = useCallback((card: Card) => {
    setSelectedCard(card)
    setMovementTargets(resolveMovementTargets(card, state))
  }, [state])

  const handleSelectDestination = useCallback((nodeId: string) => {
    if (!selectedCard) return
    setState(s => playCardForMovement(s, selectedCard.id, nodeId))
    setSelectedCard(null)
    setMovementTargets([])
  }, [selectedCard])

  const handlePlayCombatCard = useCallback((card: Card) => {
    setState(s => playCardForCombat(s, card.id))
  }, [])

  const handleCollectReward = useCallback(() => {
    setState(s => collectReward(s))
  }, [])

  const handleCollectBattleReward = useCallback((cardId: string) => {
    setState(s => collectBattleReward(s, cardId))
  }, [])

  const handleSkipBattleReward = useCallback(() => {
    setState(s => skipBattleReward(s))
  }, [])

  const handleRestart = useCallback(() => {
    setState(newGame())
    setSelectedCard(null)
    setMovementTargets([])
  }, [])

  const phase = state.phase

  return (
    <div className="game-container">
      <div className="game-title">ASCII CARD QUEST</div>

      {phase.type === 'movement' && (
        <div className="movement-layout">
          <PathMap
            state={state}
            movementTargets={movementTargets}
            onSelectDestination={handleSelectDestination}
          />
          <div className="divider" />
          <Hand
            state={state}
            selectedCardId={selectedCard?.id ?? null}
            onSelectCard={handleSelectMovementCard}
          />
        </div>
      )}

      {phase.type === 'battle' && (
        <Battle state={state} onPlayCombatCard={handlePlayCombatCard} />
      )}

      {phase.type === 'bossFight' && (
        <Battle state={state} onPlayCombatCard={handlePlayCombatCard} isBoss />
      )}

      {phase.type === 'reward' && (
        <Reward state={state} onCollect={handleCollectReward} />
      )}

      {phase.type === 'battleReward' && (
        <BattleReward state={state} onPick={handleCollectBattleReward} onSkip={handleSkipBattleReward} />
      )}

      {phase.type === 'gameOver' && (
        <GameOver state={state} won={phase.won} onRestart={handleRestart} />
      )}
    </div>
  )
}
