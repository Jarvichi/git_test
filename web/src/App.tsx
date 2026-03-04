import React, { useState, useCallback, useEffect, useRef } from 'react'
import { GameState } from './game/types'
import { newGame, playCard, tick, MAX_HANDICAP } from './game/engine'
import {
  loadDeck, saveDeck, buildDeckCards, generatePack,
  loadCollection, saveCollection, loadCrystals, saveCrystals,
  recordCardPlayed, recordUnitDied, addCardsToCollection,
  getOwnedCount, DECK_MAX, CRYSTAL_PACK_COST, DeckEntry,
} from './game/collection'
import { getCardCatalog } from './game/cards'
import {
  loadRun, saveRun, clearRun, newRun,
  getAvailableNodeIds, skipSiblings, isActComplete,
  generateRewardChoices, ACTS,
  loadFatigued, saveFatigued, clearFatigued, getTopPlayedCards,
  QuestNode, RunState,
} from './game/questline'
import { CardRestSelect }     from './components/CardRestSelect'
import { Battlefield }        from './components/Battlefield'
import { GameOver }           from './components/GameOver'
import { TitleScreen }        from './components/TitleScreen'
import { CollectionScreen }   from './components/CollectionScreen'
import { DeckBuilder }        from './components/DeckBuilder'
import { PackOpening }        from './components/PackOpening'
import { NodeMap }            from './components/NodeMap'
import { PostBattleReward }   from './components/PostBattleReward'
import { ActComplete }        from './components/ActComplete'
import { StarterPackSelect }  from './components/StarterPackSelect'
import { FakeCrashEvent }     from './components/rare-events/FakeCrashEvent'
import { BlackjackEvent }     from './components/rare-events/BlackjackEvent'
import { WrongNumberEvent }   from './components/rare-events/WrongNumberEvent'
import { NarratorEvent }      from './components/rare-events/NarratorEvent'
import { LiarsDiceEvent }     from './components/rare-events/LiarsDiceEvent'
import {
  RareEventKind, RareEventEffect,
  RARE_EVENT_CHANCE, ALL_RARE_EVENTS,
} from './components/rare-events/types'
import './styles.css'

const TICK_MS    = 100
const HANDICAP_KEY = 'jarvs_handicap'

function loadHandicap(): number {
  try {
    const v = localStorage.getItem(HANDICAP_KEY)
    if (v !== null) return Math.min(MAX_HANDICAP, Math.max(0, parseInt(v, 10)))
  } catch { /* ignore */ }
  return 0
}

type Screen =
  | 'title'
  | 'playing'
  | 'collection'
  | 'deckbuilder'
  | 'pack'
  | 'nodemap'
  | 'reward'
  | 'actcomplete'
  | 'cardrest'
  | 'starterpack'

export default function App() {
  const [screen, setScreen]       = useState<Screen>('title')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [pack, setPack]           = useState<string[]>([])
  const [handicap, setHandicap]   = useState<number>(loadHandicap)
  const [crystals, setCrystals]   = useState<number>(loadCrystals)

  // Campaign run state
  const [run, setRun]                   = useState<RunState | null>(loadRun)
  const [rewardChoices, setRewardChoices] = useState<string[]>([])
  const isCampaignRef = useRef(false)   // true while playing a campaign battle

  // Card fatigue
  const [fatiguedCards, setFatiguedCards]       = useState<string[]>(loadFatigued)
  const [cardRestCandidates, setCardRestCandidates] = useState<string[]>([])
  const [bonusPackCards, setBonusPackCards]     = useState<string[]>([])
  const campaignPlayCountsRef = useRef<Record<string, number>>({})  // per-battle play tracking

  // Unit death tracking
  const prevPlayerUnitsRef = useRef<Map<string, string>>(new Map())

  // Rare events
  const [rareEventScheduled, setRareEventScheduled] = useState<{ kind: RareEventKind; triggerMs: number } | null>(null)
  const [activeRareEvent,    setActiveRareEvent]    = useState<RareEventKind | null>(null)
  const [isGamePaused,       setIsGamePaused]       = useState(false)

  // ── Game loop ────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'playing' || !gameState) return
    if (gameState.phase.type === 'gameOver') return
    if (isGamePaused) return
    const id = setInterval(() => {
      setGameState(s => s ? tick(s, TICK_MS) : s)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [screen, gameState?.phase.type, isGamePaused])

  // ── Rare event trigger ───────────────────────────────────
  useEffect(() => {
    if (!rareEventScheduled || activeRareEvent) return
    if (!gameState || screen !== 'playing') return
    if (gameState.phase.type === 'gameOver') return
    if (gameState.gameTime < rareEventScheduled.triggerMs) return
    const { kind } = rareEventScheduled
    setActiveRareEvent(kind)
    if (kind === 'blackjack' || kind === 'liarsDice') setIsGamePaused(true)
  }, [gameState?.gameTime, rareEventScheduled, activeRareEvent, screen])

  // ── Helpers ──────────────────────────────────────────────

  function rollRareEvent() {
    if (Math.random() < RARE_EVENT_CHANCE) {
      const kind = ALL_RARE_EVENTS[Math.floor(Math.random() * ALL_RARE_EVENTS.length)]
      const triggerMs = 20000 + Math.random() * 30000
      setRareEventScheduled({ kind, triggerMs })
    } else {
      setRareEventScheduled(null)
    }
    setActiveRareEvent(null)
    setIsGamePaused(false)
  }

  const handleRareEventDone = useCallback((effect?: RareEventEffect) => {
    setActiveRareEvent(null)
    setRareEventScheduled(null)
    setIsGamePaused(false)
    if (!effect) return
    setGameState(s => {
      if (!s) return s
      let next = { ...s }
      if (effect.damage) {
        next = { ...next, opponentBase: { ...next.opponentBase, hp: Math.max(0, next.opponentBase.hp - effect.damage) } }
      }
      if (effect.selfDamage) {
        next = { ...next, playerBase: { ...next.playerBase, hp: Math.max(0, next.playerBase.hp - effect.selfDamage) } }
      }
      if (effect.killEnemyUnits) {
        const enemies = next.field.filter(u => u.owner === 'opponent' && u.moveSpeed > 0)
        const toKill  = new Set(enemies.slice(0, effect.killEnemyUnits).map(u => u.id))
        next = { ...next, field: next.field.filter(u => !toKill.has(u.id)) }
      }
      if (effect.logMessage) {
        next = { ...next, log: [...next.log.slice(-9), effect.logMessage] }
      }
      return next
    })
    if (effect.crystals) {
      const next = loadCrystals() + effect.crystals
      saveCrystals(next)
      setCrystals(next)
    }
  }, [])

  // ── Free play ────────────────────────────────────────────

  const handlePlay = useCallback(() => {
    isCampaignRef.current = false
    const collection  = loadCollection()
    const playerCards = buildDeckCards(loadDeck(), collection)
    setGameState(newGame(playerCards, handicap))
    setScreen('playing')
    rollRareEvent()
  }, [handicap])

  const handlePlayAgain = useCallback(() => {
    if (!gameState || gameState.phase.type !== 'gameOver') return
    isCampaignRef.current = false
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
    rollRareEvent()
  }, [gameState, handicap])

  // ── Campaign ─────────────────────────────────────────────

  const handleCampaign = useCallback(() => {
    // Load or create run
    const existing = loadRun()
    const activeRun = existing ?? newRun('act1')
    if (!existing) saveRun(activeRun)
    setRun(activeRun)
    setScreen('nodemap')
  }, [])

  const handleSelectNode = useCallback((node: QuestNode) => {
    const currentRun = run
    if (!currentRun) return
    const act = ACTS[currentRun.actId]

    // Mark siblings as skipped (branch choice)
    const afterSkip = skipSiblings(act, node.id, currentRun)
    const updatedRun: RunState = { ...afterSkip, pendingNodeId: node.id }
    saveRun(updatedRun)
    setRun(updatedRun)

    if (node.type === 'rest') {
      // Instantly heal, mark complete, stay on map
      const healed = Math.min(updatedRun.maxHp, updatedRun.playerHp + (node.restHeal ?? 5))
      const afterRest: RunState = {
        ...updatedRun,
        playerHp: healed,
        completedNodeIds: [...updatedRun.completedNodeIds, node.id],
        pendingNodeId: null,
      }
      saveRun(afterRest)
      setRun(afterRest)
      return
    }

    // Start battle
    campaignPlayCountsRef.current = {}
    isCampaignRef.current = true
    const collection  = loadCollection()
    const fatigued    = loadFatigued()
    const deckEntries = loadDeck().filter(e => !fatigued.includes(e.cardName))
    const playerCards = buildDeckCards(deckEntries, collection)
    const state = newGame(playerCards, node.handicap ?? 0, node.bossAI)
    // Apply campaign HP to player base
    state.playerBase = { hp: updatedRun.playerHp, maxHp: updatedRun.maxHp }
    setGameState(state)
    setScreen('playing')
    rollRareEvent()
  }, [run])

  const handleCampaignWin = useCallback(() => {
    const currentRun = run
    if (!currentRun || !gameState) return
    const act = ACTS[currentRun.actId]
    const nodeId = currentRun.pendingNodeId!
    const node = act.nodes[nodeId]

    // Merge this battle's card play counts into the run totals
    const mergedCounts: Record<string, number> = { ...currentRun.cardPlayCounts }
    for (const [name, n] of Object.entries(campaignPlayCountsRef.current)) {
      mergedCounts[name] = (mergedCounts[name] ?? 0) + n
    }
    campaignPlayCountsRef.current = {}

    // Update run HP and counts from battle result
    const updatedRun: RunState = {
      ...currentRun,
      playerHp: gameState.playerBase.hp,
      completedNodeIds: [...currentRun.completedNodeIds, nodeId],
      pendingNodeId: null,
      cardPlayCounts: mergedCounts,
    }
    saveRun(updatedRun)
    setRun(updatedRun)

    // Check act complete
    if (isActComplete(act, updatedRun)) {
      setScreen('actcomplete')
      return
    }

    // Show card reward
    const choices = generateRewardChoices(node.type)
    setRewardChoices(choices)
    setScreen('reward')
  }, [run, gameState])

  const handleRewardPick = useCallback((cardName: string) => {
    addCardsToCollection([{ cardName, count: 1 }])
    setScreen('nodemap')
  }, [])

  const handleRewardSkip = useCallback(() => {
    setScreen('nodemap')
  }, [])

  const handleActComplete = useCallback(() => {
    // Check if we have enough play data to offer a rest choice
    const counts = run?.cardPlayCounts ?? {}
    const candidates = getTopPlayedCards(counts, 3)
    if (candidates.length >= 2) {
      setCardRestCandidates(candidates)
      setScreen('cardrest')
    } else {
      // Not enough data (very short run) — skip rest and go straight to deck reset
      clearRun()
      setRun(null)
      clearFatigued()
      setFatiguedCards([])
      setBonusPackCards([])
      setScreen('starterpack')
    }
  }, [run])

  const handleCardRestConfirm = useCallback((resting: string[]) => {
    saveFatigued(resting)
    setFatiguedCards(resting)

    // Check if fatiguing those cards shrinks usable collection below DECK_MAX
    const collection = loadCollection()
    const catalog = getCardCatalog()
    const totalOwned = catalog
      .filter(c => !resting.includes(c.name))
      .reduce((sum, c) => sum + getOwnedCount(collection, c.name), 0)

    const bonus: string[] = []
    if (totalOwned < DECK_MAX) {
      const needed = DECK_MAX - totalOwned
      const packsNeeded = Math.ceil(needed / 5)
      for (let i = 0; i < packsNeeded; i++) bonus.push(...generatePack())
      addCardsToCollection(bonus.map(name => ({ cardName: name, count: 1 })))
    }
    setBonusPackCards(bonus)

    clearRun()
    setRun(null)
    setScreen('starterpack')
  }, [])

  const handleStarterPackPick = useCallback((cards: DeckEntry[]) => {
    saveDeck(cards)
    setScreen('deckbuilder')
  }, [])

  const handleCampaignRetry = useCallback(() => {
    const currentRun = run
    if (!currentRun) { setScreen('title'); return }
    const act = ACTS[currentRun.actId]
    const nodeId = currentRun.pendingNodeId
    if (!nodeId) { setScreen('nodemap'); return }
    const node = act.nodes[nodeId]

    // Retry same node, but HP stays at what it was before this battle
    campaignPlayCountsRef.current = {}
    isCampaignRef.current = true
    const collection  = loadCollection()
    const fatigued    = loadFatigued()
    const deckEntries = loadDeck().filter(e => !fatigued.includes(e.cardName))
    const playerCards = buildDeckCards(deckEntries, collection)
    const state = newGame(playerCards, node.handicap ?? 0, node.bossAI)
    state.playerBase = { hp: currentRun.playerHp, maxHp: currentRun.maxHp }
    setGameState(state)
    setScreen('playing')
    rollRareEvent()
  }, [run])

  const handleAbandonRun = useCallback(() => {
    clearRun()
    setRun(null)
    setScreen('title')
  }, [])

  // ── Card plays ───────────────────────────────────────────

  const handlePlayCard = useCallback((cardId: string) => {
    setGameState(s => {
      if (!s) return s
      const card = s.playerHand.find(c => c.id === cardId)
      if (card) {
        recordCardPlayed(card.name)
        if (isCampaignRef.current) {
          campaignPlayCountsRef.current[card.name] =
            (campaignPlayCountsRef.current[card.name] ?? 0) + 1
        }
      }
      return playCard(s, cardId)
    })
  }, [])

  // Detect player unit deaths each tick
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

  // ── Pack ─────────────────────────────────────────────────

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
    isCampaignRef.current = false
    setScreen('title')
    setGameState(null)
  }, [])

  // ── Game over routing ────────────────────────────────────

  const isCampaign = isCampaignRef.current

  const handleGameOverPrimary = useCallback(() => {
    if (!gameState || gameState.phase.type !== 'gameOver') return
    if (isCampaignRef.current) {
      if (gameState.phase.winner === 'player') {
        handleCampaignWin()
      } else {
        // lose/draw: retry or abandon
        handleCampaignRetry()
      }
    } else {
      handlePlayAgain()
    }
  }, [gameState, handleCampaignWin, handleCampaignRetry, handlePlayAgain])

  // ── Render ───────────────────────────────────────────────

  const actData = run ? ACTS[run.actId] : null

  return (
    <div className="game-container">
      <div className="game-title">JARV'S AMAZING WEB GAME</div>

      {screen === 'title' && (
        <TitleScreen
          crystals={crystals}
          onPlay={handlePlay}
          onCampaign={handleCampaign}
          onCollection={() => setScreen('collection')}
          onDeckBuilder={() => setScreen('deckbuilder')}
        />
      )}

      {screen === 'nodemap' && run && actData && (
        <NodeMap
          act={actData}
          run={run}
          onSelectNode={handleSelectNode}
          onBack={handleMainMenu}
        />
      )}

      {screen === 'reward' && (
        <PostBattleReward
          choices={rewardChoices}
          nodeType={run ? ACTS[run.actId].nodes[run.completedNodeIds[run.completedNodeIds.length - 1]]?.type ?? 'battle' : 'battle'}
          onPick={handleRewardPick}
          onSkip={handleRewardSkip}
        />
      )}

      {screen === 'actcomplete' && actData && (
        <ActComplete
          actTitle={actData.title}
          actSubtitle={actData.subtitle}
          relicName={actData.rewardRelic}
          relicDesc={actData.rewardRelicDesc}
          onContinue={handleActComplete}
        />
      )}

      {screen === 'cardrest' && (
        <CardRestSelect
          candidates={cardRestCandidates}
          playCounts={run?.cardPlayCounts ?? {}}
          onConfirm={handleCardRestConfirm}
        />
      )}

      {screen === 'starterpack' && (
        <StarterPackSelect
          onPick={handleStarterPackPick}
          fatiguedCards={fatiguedCards}
          bonusCards={bonusPackCards}
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
        <DeckBuilder onBack={() => setScreen('title')} fatiguedCards={fatiguedCards} />
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
            onOpenPack={!isCampaignRef.current && gameState.phase.winner === 'player' ? handleOpenPack : undefined}
            onPlayAgain={isCampaignRef.current
              ? (gameState.phase.winner === 'player' ? handleCampaignWin : handleCampaignRetry)
              : handlePlayAgain
            }
            onMainMenu={handleMainMenu}
            campaignAbandon={isCampaignRef.current ? handleAbandonRun : undefined}
          />
        ) : (
          <>
            <Battlefield state={gameState} onPlayCard={handlePlayCard} />
            {activeRareEvent === 'fakeCrash'   && <FakeCrashEvent   onDone={handleRareEventDone} />}
            {activeRareEvent === 'blackjack'   && <BlackjackEvent   onDone={handleRareEventDone} />}
            {activeRareEvent === 'wrongNumber' && <WrongNumberEvent onDone={handleRareEventDone} />}
            {activeRareEvent === 'narrator'    && <NarratorEvent    onDone={handleRareEventDone} />}
            {activeRareEvent === 'liarsDice'   && <LiarsDiceEvent   onDone={handleRareEventDone} />}
          </>
        )
      )}
    </div>
  )
}
