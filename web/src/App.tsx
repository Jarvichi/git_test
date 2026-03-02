import React, { useState, useCallback, useEffect } from 'react'
import { GameState } from './game/types'
import { newGame, playCard, tick, MAX_HANDICAP } from './game/engine'
import { loadDeck, buildDeckCards, generatePack } from './game/collection'
import { Battlefield } from './components/Battlefield'
import { GameOver } from './components/GameOver'
import { TitleScreen } from './components/TitleScreen'
import { CollectionScreen } from './components/CollectionScreen'
import { DeckBuilder } from './components/DeckBuilder'
import { PackOpening } from './components/PackOpening'
import './styles.css'

const TICK_MS = 100
const HANDICAP_KEY = 'jarvs_handicap'

function loadHandicap(): number {
  try {
    const v = localStorage.getItem(HANDICAP_KEY)
    if (v !== null) return Math.min(MAX_HANDICAP, Math.max(0, parseInt(v, 10)))
  } catch { /* ignore */ }
  return 0
}

type Screen = 'title' | 'playing' | 'collection' | 'deckbuilder' | 'pack'

export default function App() {
  const [screen, setScreen]       = useState<Screen>('title')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [pack, setPack]           = useState<string[]>([])
  const [handicap, setHandicap]   = useState<number>(loadHandicap)

  // ── Game loop ────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'playing' || !gameState) return
    if (gameState.phase.type === 'gameOver') return
    const id = setInterval(() => {
      setGameState(s => s ? tick(s, TICK_MS) : s)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [screen, gameState?.phase.type])

  // ── Actions ──────────────────────────────────────────────
  const handlePlay = useCallback(() => {
    const playerCards = buildDeckCards(loadDeck())
    setGameState(newGame(playerCards, handicap))
    setScreen('playing')
  }, [handicap])

  const handlePlayCard = useCallback((cardId: string) => {
    setGameState(s => s ? playCard(s, cardId) : s)
  }, [])

  const handlePlayAgain = useCallback(() => {
    if (!gameState || gameState.phase.type !== 'gameOver') return
    const winner = gameState.phase.winner
    const nextHandicap = winner === 'player'
      ? Math.max(0, handicap - 1)
      : winner === 'opponent'
        ? Math.min(MAX_HANDICAP, handicap + 1)
        : handicap
    try { localStorage.setItem(HANDICAP_KEY, String(nextHandicap)) } catch { /* ignore */ }
    setHandicap(nextHandicap)
    const playerCards = buildDeckCards(loadDeck())
    setGameState(newGame(playerCards, nextHandicap))
    setScreen('playing')
  }, [gameState, handicap])

  const handleOpenPack = useCallback(() => {
    setPack(generatePack())
    setScreen('pack')
  }, [])

  const handlePackDone = useCallback(() => {
    setScreen('title')
  }, [])

  const handleMainMenu = useCallback(() => {
    setScreen('title')
    setGameState(null)
  }, [])

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="game-container">
      <div className="game-title">JARV'S AMAZING WEB GAME</div>

      {screen === 'title' && (
        <TitleScreen
          onPlay={handlePlay}
          onCollection={() => setScreen('collection')}
          onDeckBuilder={() => setScreen('deckbuilder')}
        />
      )}

      {screen === 'collection' && (
        <CollectionScreen onBack={() => setScreen('title')} />
      )}

      {screen === 'deckbuilder' && (
        <DeckBuilder onBack={() => setScreen('title')} />
      )}

      {screen === 'pack' && (
        <PackOpening pack={pack} onDone={handlePackDone} />
      )}

      {screen === 'playing' && gameState && (
        gameState.phase.type === 'gameOver' ? (
          <GameOver
            state={gameState}
            winner={gameState.phase.winner}
            handicap={handicap}
            onOpenPack={gameState.phase.winner === 'player' ? handleOpenPack : undefined}
            onPlayAgain={handlePlayAgain}
            onMainMenu={handleMainMenu}
          />
        ) : (
          <Battlefield state={gameState} onPlayCard={handlePlayCard} />
        )
      )}
    </div>
  )
}
