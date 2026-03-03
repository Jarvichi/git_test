import React, { useState, useCallback, useEffect, useRef } from 'react'
import { GameState } from './game/types'
import { newGame, playCard, tick, MAX_HANDICAP } from './game/engine'
import {
  loadDeck, buildDeckCards, generatePack,
  loadCollection, saveCollection, loadCrystals, saveCrystals,
  recordCardPlayed, recordUnitDied,
  CRYSTAL_PACK_COST,
} from './game/collection'
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
  const [crystals, setCrystals]   = useState<number>(loadCrystals)
  // Map of unit id → unit name for the player's units, used to detect deaths
  const prevPlayerUnitsRef = useRef<Map<string, string>>(new Map())

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
    const collection  = loadCollection()
    const playerCards = buildDeckCards(loadDeck(), collection)
    setGameState(newGame(playerCards, handicap))
    setScreen('playing')
  }, [handicap])

  const handlePlayCard = useCallback((cardId: string) => {
    setGameState(s => {
      if (!s) return s
      const card = s.playerHand.find(c => c.id === cardId)
      if (card) recordCardPlayed(card.name)
      return playCard(s, cardId)
    })
  }, [])

  // Detect player unit deaths each game tick
  useEffect(() => {
    if (!gameState || screen !== 'playing') return
    const currentMap = new Map<string, string>()
    for (const u of gameState.field) {
      if (u.owner === 'player') currentMap.set(u.id, u.name)
    }
    for (const [id, name] of prevPlayerUnitsRef.current) {
      if (!currentMap.has(id)) recordUnitDied(name)
    }
    prevPlayerUnitsRef.current = currentMap
  }, [gameState?.field])

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
    const collection  = loadCollection()
    const playerCards = buildDeckCards(loadDeck(), collection)
    setGameState(newGame(playerCards, nextHandicap))
    setScreen('playing')
  }, [gameState, handicap])

  const handleOpenPack = useCallback(() => {
    setPack(generatePack())
    setScreen('pack')
  }, [])

  const handleBuyCrystalPack = useCallback(() => {
    const current = loadCrystals()
    if (current < CRYSTAL_PACK_COST) return
    const next = current - CRYSTAL_PACK_COST
    saveCrystals(next)
    setCrystals(next)
    setPack(generatePack())
    setScreen('pack')
  }, [])

  const handleCrystalsChanged = useCallback((n: number) => {
    setCrystals(n)
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
          crystals={crystals}
          onPlay={handlePlay}
          onCollection={() => setScreen('collection')}
          onDeckBuilder={() => setScreen('deckbuilder')}
        />
      )}

      {screen === 'collection' && (
        <CollectionScreen
          crystals={crystals}
          onCrystalsChanged={handleCrystalsChanged}
          onBuyCrystalPack={handleBuyCrystalPack}
          onBack={() => setScreen('title')}
        />
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
