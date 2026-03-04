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
  generateRewardChoices, generateMerchantCards, MERCHANT_PRICES, ACTS,
  loadFatigued, saveFatigued, clearFatigued, getTopPlayedCards,
  hasSeenIntro, markIntroSeen,
  loadRunCount, incrementRunCount, getAct1Intro,
  EVENT_CATALOG, EventChoice,
  CutscenePanel, QuestNode, RunState,
} from './game/questline'
import { CardRestSelect }       from './components/CardRestSelect'
import { EventScreen }          from './components/EventScreen'
import { MerchantScreen, MerchantItem } from './components/MerchantScreen'
import { CutsceneScreen }       from './components/CutsceneScreen'
import { BossDialogueScreen }   from './components/BossDialogueScreen'
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
import { SettingsScreen, applyTextSettings } from './components/SettingsScreen'
import { FakeCrashEvent }     from './components/rare-events/FakeCrashEvent'
import { BlackjackEvent }     from './components/rare-events/BlackjackEvent'
import { WrongNumberEvent }   from './components/rare-events/WrongNumberEvent'
import { NarratorEvent }      from './components/rare-events/NarratorEvent'
import { LiarsDiceEvent }     from './components/rare-events/LiarsDiceEvent'
import {
  RareEventKind, RareEventEffect,
  RARE_EVENT_CHANCE, ALL_RARE_EVENTS,
} from './components/rare-events/types'
import { CardTile }           from './components/CardTile'
import { playCardPlay, playButtonClick, playBattleEvent, playCardFlip, playRestHeal, startBattleMusic, stopBattleMusic, startTitleMusic, stopTitleMusic, startGameOverMusic, stopGameOverMusic, startMapMusic, stopMapMusic } from './game/sound'
import './styles.css'

// Apply saved display settings on load
applyTextSettings()

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
  | 'settings'
  | 'playing'
  | 'collection'
  | 'deckbuilder'
  | 'pack'
  | 'nodemap'
  | 'cutscene'
  | 'bossdialogue'
  | 'event'
  | 'merchant'
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

  // Cutscenes & boss dialogue
  const [cutscenePanels, setCutscenePanels]   = useState<CutscenePanel[]>([])
  const cutsceneDoneRef = useRef<() => void>(() => {})
  const [bossDialogueNode, setBossDialogueNode] = useState<QuestNode | null>(null)

  // Active campaign event
  const [activeEvent, setActiveEvent] = useState<typeof EVENT_CATALOG[string] | null>(null)
  // Card revealed after a gainCard event choice
  const [pendingEventCard, setPendingEventCard] = useState<string | null>(null)

  // Active merchant
  const [merchantItems, setMerchantItems] = useState<MerchantItem[]>([])

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

  // ── Music router ─────────────────────────────────────────
  // Exactly one track plays at a time; switching screen stops all others.
  useEffect(() => {
    const phase = gameState?.phase
    stopBattleMusic()
    stopTitleMusic()
    stopGameOverMusic()
    stopMapMusic()

    if (screen === 'title' || screen === 'settings' || screen === 'deckbuilder' || screen === 'collection') {
      startTitleMusic()
    } else if (screen === 'nodemap') {
      startMapMusic()
    } else if (screen === 'playing') {
      if (phase?.type === 'playing') {
        startBattleMusic()
      } else if (phase?.type === 'gameOver') {
        startGameOverMusic(phase.winner)
      }
    }
    return () => { stopBattleMusic(); stopTitleMusic(); stopGameOverMusic(); stopMapMusic() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, gameState?.phase.type])

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
    const existing = loadRun()
    const activeRun = existing ?? newRun('act1')
    if (!existing) saveRun(activeRun)
    setRun(activeRun)

    // Show act intro cutscene when starting a fresh run
    const act = ACTS[activeRun.actId]
    if (!existing) {
      // Increment run count and get narrative-varied panels
      const runCount = incrementRunCount()
      const introToShow = activeRun.actId === 'act1'
        ? getAct1Intro(runCount)
        : (act.intro ?? [])
      markIntroSeen(activeRun.actId)
      if (introToShow.length > 0) {
        setCutscenePanels(introToShow)
        cutsceneDoneRef.current = () => setScreen('nodemap')
        setScreen('cutscene')
        return
      }
    }
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

    if (node.type === 'event' && node.eventId) {
      const eventData = EVENT_CATALOG[node.eventId]
      if (eventData) {
        setActiveEvent(eventData)
        setScreen('event')
        return
      }
    }

    if (node.type === 'merchant') {
      const catalog   = getCardCatalog()
      const cardNames = generateMerchantCards()
      const items: MerchantItem[] = cardNames.map(name => {
        const card = catalog.find(c => c.name === name)!
        return { card, price: MERCHANT_PRICES[card.rarity] }
      })
      setMerchantItems(items)
      setScreen('merchant')
      return
    }

    // Boss pre-battle dialogue
    if (node.bossDialogue && node.bossDialogue.length > 0) {
      setBossDialogueNode(node)
      setScreen('bossdialogue')
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

  const handleBossDialogueDone = useCallback(() => {
    const node = bossDialogueNode
    if (!node || !run) return
    setBossDialogueNode(null)
    // Now actually start the battle
    campaignPlayCountsRef.current = {}
    isCampaignRef.current = true
    const collection  = loadCollection()
    const fatigued    = loadFatigued()
    const deckEntries = loadDeck().filter(e => !fatigued.includes(e.cardName))
    const playerCards = buildDeckCards(deckEntries, collection)
    const state = newGame(playerCards, node.handicap ?? 0, node.bossAI)
    state.playerBase = { hp: run.playerHp, maxHp: run.maxHp }
    setGameState(state)
    setScreen('playing')
    rollRareEvent()
  }, [bossDialogueNode, run])

  const handleEventChoice = useCallback((choice: EventChoice) => {
    const currentRun = run
    if (!currentRun) return
    const nodeId = currentRun.pendingNodeId!

    // Apply the effect
    let updatedRun: RunState = {
      ...currentRun,
      completedNodeIds: [...currentRun.completedNodeIds, nodeId],
      pendingNodeId: null,
    }

    const effect = choice.effect
    if (effect.type === 'healHp') {
      updatedRun = { ...updatedRun, playerHp: Math.min(updatedRun.maxHp, updatedRun.playerHp + effect.amount) }
    } else if (effect.type === 'damageHp') {
      updatedRun = { ...updatedRun, playerHp: Math.max(1, updatedRun.playerHp - effect.amount) }
    } else if (effect.type === 'gainCrystals') {
      const next = loadCrystals() + effect.amount
      saveCrystals(next)
      setCrystals(next)
    } else if (effect.type === 'gainCard') {
      const catalog = getCardCatalog()
      const pool = catalog.filter(c => c.rarity === effect.rarity)
      const card = pool[Math.floor(Math.random() * pool.length)]
      if (card) {
        addCardsToCollection([{ cardName: card.name, count: 1 }])
        saveRun(updatedRun)
        setRun(updatedRun)
        setActiveEvent(null)
        setPendingEventCard(card.name)
        playCardFlip()
        return   // show card reveal before going to nodemap
      }
    }

    saveRun(updatedRun)
    setRun(updatedRun)
    setActiveEvent(null)
    setScreen('nodemap')
  }, [run])

  const handleMerchantBuy = useCallback((cardName: string, price: number) => {
    addCardsToCollection([{ cardName, count: 1 }])
    const next = loadCrystals() - price
    saveCrystals(Math.max(0, next))
    setCrystals(Math.max(0, next))
  }, [])

  const handleMerchantDone = useCallback(() => {
    const currentRun = run
    if (!currentRun) return
    const nodeId = currentRun.pendingNodeId!
    const updatedRun: RunState = {
      ...currentRun,
      completedNodeIds: [...currentRun.completedNodeIds, nodeId],
      pendingNodeId: null,
    }
    saveRun(updatedRun)
    setRun(updatedRun)
    setMerchantItems([])
    setScreen('nodemap')
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
      if (act.outro && act.outro.length > 0) {
        setCutscenePanels(act.outro)
        cutsceneDoneRef.current = () => setScreen('actcomplete')
        setScreen('cutscene')
      } else {
        setScreen('actcomplete')
      }
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
    playCardPlay()
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
    // If we're leaving mid-campaign battle, clear pendingNodeId so the node
    // is selectable again when the player returns via "Continue Campaign".
    const currentRun = run
    if (currentRun?.pendingNodeId) {
      const cleared = { ...currentRun, pendingNodeId: null }
      saveRun(cleared)
      setRun(cleared)
    }
    setScreen('title')
    setGameState(null)
  }, [run])

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

  // ─── Reset game ──────────────────────────────────────────
  const handleResetGame = useCallback(() => {
    const KEYS = [
      'jarv_collection', 'jarv_deck', 'jarv_crystals',
      'jarv_run', 'jarv_card_stats', 'jarv_fatigued',
      'jarv_seen_intros', 'jarvs_handicap', 'jarv_run_count',
    ]
    KEYS.forEach(k => { try { localStorage.removeItem(k) } catch { /* ignore */ } })
    window.location.reload()
  }, [])

  // ── Render ───────────────────────────────────────────────

  const actData = run ? ACTS[run.actId] : null
  const actTheme = run?.actId

  return (
    <div className="game-container">
      <div className="game-title">JARV'S AMAZING WEB GAME</div>

      {/* Event card reveal overlay */}
      {pendingEventCard && (() => {
        const catalog = getCardCatalog()
        const card = catalog.find(c => c.name === pendingEventCard)
        if (!card) { setPendingEventCard(null); return null }
        return (
          <div className="event-card-reveal-backdrop" onClick={() => { setPendingEventCard(null); setScreen('nodemap') }}>
            <div className="event-card-reveal-label">YOU GAINED A CARD</div>
            <CardTile card={card} canAfford={true} />
            <div className="event-card-reveal-sub">Click anywhere to continue</div>
          </div>
        )
      })()}

      {screen === 'title' && (
        <TitleScreen
          crystals={crystals}
          onPlay={handlePlay}
          onCampaign={handleCampaign}
          onCollection={() => setScreen('collection')}
          onDeckBuilder={() => setScreen('deckbuilder')}
          onSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'settings' && (
        <SettingsScreen onBack={() => setScreen('title')} onResetGame={handleResetGame} />
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

      {screen === 'cutscene' && cutscenePanels.length > 0 && (
        <CutsceneScreen panels={cutscenePanels} onDone={() => cutsceneDoneRef.current()} />
      )}

      {screen === 'bossdialogue' && bossDialogueNode?.bossDialogue && (
        <BossDialogueScreen
          bossName={bossDialogueNode.label}
          lines={bossDialogueNode.bossDialogue}
          onDone={handleBossDialogueDone}
        />
      )}

      {screen === 'event' && activeEvent && (
        <EventScreen event={activeEvent} onChoice={handleEventChoice} />
      )}

      {screen === 'merchant' && merchantItems.length > 0 && (
        <MerchantScreen
          items={merchantItems}
          crystals={crystals}
          onBuy={handleMerchantBuy}
          onDone={handleMerchantDone}
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
            <Battlefield state={gameState} onPlayCard={handlePlayCard} actTheme={actTheme} />
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
