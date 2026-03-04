// ─── Web Audio API Sound Engine ──────────────────────────────────────────────
// All sounds are procedurally generated — no external audio files needed.

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null

const SETTINGS_KEY = 'jarv_sound_enabled'

export function isSoundEnabled(): boolean {
  try { return localStorage.getItem(SETTINGS_KEY) !== 'false' }
  catch { return true }
}

export function setSoundEnabled(val: boolean): void {
  try { localStorage.setItem(SETTINGS_KEY, val ? 'true' : 'false') }
  catch { /* ignore */ }
}

function getCtx(): AudioContext | null {
  if (!isSoundEnabled()) return null
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      masterGain = ctx.createGain()
      masterGain.gain.value = 0.35
      masterGain.connect(ctx.destination)
    }
    return ctx
  } catch {
    return null
  }
}

function node(freq: number, type: OscillatorType, startT: number, dur: number, gainAmt = 0.3): void {
  const c = getCtx()
  if (!c || !masterGain) return
  const osc = c.createOscillator()
  const g   = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startT)
  g.gain.setValueAtTime(gainAmt, startT)
  g.gain.exponentialRampToValueAtTime(0.001, startT + dur)
  osc.connect(g)
  g.connect(masterGain)
  osc.start(startT)
  osc.stop(startT + dur + 0.05)
}

function now(): number {
  const c = getCtx()
  return c ? c.currentTime : 0
}

// ─── Individual sounds ────────────────────────────────────────────────────────

export function playCardPlay() {
  const t = now()
  node(440, 'sine', t,       0.08, 0.25)
  node(660, 'sine', t + 0.06, 0.10, 0.20)
}

export function playUnitDeath() {
  const t = now()
  node(200, 'sawtooth', t,       0.08, 0.2)
  node(140, 'square',   t + 0.05, 0.12, 0.15)
}

export function playVictory() {
  const t = now()
  const melody = [523, 659, 784, 1047]
  melody.forEach((f, i) => node(f, 'sine', t + i * 0.12, 0.18, 0.3))
}

export function playDefeat() {
  const t = now()
  const melody = [400, 350, 280, 220]
  melody.forEach((f, i) => node(f, 'sawtooth', t + i * 0.15, 0.22, 0.25))
}

export function playButtonClick() {
  const t = now()
  node(880, 'sine', t, 0.06, 0.15)
}

export function playBattleEvent() {
  const t = now()
  node(220, 'sawtooth', t,       0.12, 0.4)
  node(440, 'square',   t + 0.08, 0.10, 0.3)
  node(660, 'sine',     t + 0.18, 0.14, 0.35)
}

export function playCardFlip() {
  const t = now()
  node(600, 'sine', t,       0.04, 0.2)
  node(900, 'sine', t + 0.04, 0.06, 0.15)
}

export function playRestHeal() {
  const t = now()
  const notes = [523, 659, 784]
  notes.forEach((f, i) => node(f, 'sine', t + i * 0.1, 0.2, 0.22))
}

export function playManaGain() {
  const t = now()
  node(700, 'sine', t,       0.05, 0.18)
  node(1050, 'sine', t + 0.05, 0.07, 0.15)
}

// ─── Music Engine ─────────────────────────────────────────────────────────────
// Look-ahead scheduler pattern — runs a setInterval every SCHEDULE_MS and
// pre-schedules Web Audio notes up to LOOKAHEAD_SEC ahead of playback.

const LOOKAHEAD_SEC = 0.3
const SCHEDULE_MS   = 100

interface MusicTrack {
  scheduler:    ReturnType<typeof setInterval> | null
  nextBeatTime: number
  beatIndex:    number
  gainNode:     GainNode | null
}

function makeTrack(): MusicTrack {
  return { scheduler: null, nextBeatTime: 0, beatIndex: 0, gainNode: null }
}

function trackGain(track: MusicTrack, vol: number): GainNode | null {
  const c = getCtx()
  if (!c) return null
  if (!track.gainNode) {
    track.gainNode = c.createGain()
    track.gainNode.gain.value = vol
    track.gainNode.connect(c.destination)
  }
  return track.gainNode
}

function musicNote(
  track: MusicTrack, vol: number,
  freq: number, type: OscillatorType, startT: number, dur: number, noteVol: number,
): void {
  const c = getCtx()
  const g = trackGain(track, vol)
  if (!c || !g) return
  const osc = c.createOscillator()
  const gn  = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startT)
  gn.gain.setValueAtTime(noteVol, startT)
  gn.gain.exponentialRampToValueAtTime(0.001, startT + dur)
  osc.connect(gn)
  gn.connect(g)
  osc.start(startT)
  osc.stop(startT + dur + 0.05)
}

function startTrack(
  track: MusicTrack,
  vol: number,
  beatSec: number,
  scheduler: (track: MusicTrack, vol: number, beatSec: number, upTo: number) => void,
  stopFn: () => void,
): void {
  if (track.scheduler !== null) return
  const c = getCtx()
  if (!c) return
  track.nextBeatTime = c.currentTime + 0.1
  track.beatIndex    = 0
  scheduler(track, vol, beatSec, c.currentTime + LOOKAHEAD_SEC)
  track.scheduler = setInterval(() => {
    const c2 = getCtx()
    if (!c2 || !isSoundEnabled()) { stopFn(); return }
    scheduler(track, vol, beatSec, c2.currentTime + LOOKAHEAD_SEC)
  }, SCHEDULE_MS)
}

function stopTrack(track: MusicTrack): void {
  if (track.scheduler !== null) {
    clearInterval(track.scheduler)
    track.scheduler = null
  }
}

// ─── Battle Music (A minor pentatonic, 95 BPM) ───────────────────────────────

const BATTLE_BPM       = 95
const BATTLE_BEAT_SEC  = 60 / BATTLE_BPM
const BATTLE_VOL       = 0.12

const BATTLE_BASS   = [110.0, 130.8, 146.8, 164.8, 196.0]
const BATTLE_MELODY = [440.0, 523.2, 587.3, 659.3, 784.0]
const BATTLE_BASS_PAT:   number[]        = [0, 0, 2, 0, 3, 0, 2, 1]
const BATTLE_MELODY_PAT: (number|null)[] = [0, null, null, 2, null, 3, null, null]

const bgTrack = makeTrack()

function scheduleBattle(track: MusicTrack, vol: number, beatSec: number, upTo: number): void {
  while (track.nextBeatTime < upTo) {
    const beat = track.beatIndex % 8
    const t    = track.nextBeatTime
    const n    = (f: number, type: OscillatorType, off: number, dur: number, v: number) =>
                   musicNote(track, vol, f, type, t + off, dur, v)

    n(BATTLE_BASS[BATTLE_BASS_PAT[beat]], 'sawtooth', 0, beatSec * 0.85, 0.5)
    n(BATTLE_BASS[BATTLE_BASS_PAT[beat]] / 2, 'sine', 0, beatSec * 0.9, 0.3)

    const melIdx = BATTLE_MELODY_PAT[beat]
    if (melIdx !== null) n(BATTLE_MELODY[melIdx], 'sine', beatSec * 0.05, beatSec * 0.55, 0.4)

    if (beat === 2 || beat === 6) {
      n(3000 + Math.random() * 1000, 'square', 0, 0.04, 0.08)
      n(2000 + Math.random() * 800,  'square', 0, 0.06, 0.06)
    }
    track.nextBeatTime += beatSec
    track.beatIndex++
  }
}

export function startBattleMusic(): void {
  startTrack(bgTrack, BATTLE_VOL, BATTLE_BEAT_SEC, scheduleBattle, stopBattleMusic)
}
export function stopBattleMusic(): void { stopTrack(bgTrack) }

// ─── Title Music (C major, slow pads, 60 BPM) ────────────────────────────────

const TITLE_BPM      = 60
const TITLE_BEAT_SEC = 60 / TITLE_BPM
const TITLE_VOL      = 0.10

// C major pentatonic: C3, E3, G3, A3, C4, E4, G4
const TITLE_PADS   = [130.8, 164.8, 196.0, 220.0, 261.6, 329.6, 392.0]
const TITLE_BASS   = [65.4, 65.4, 73.4, 65.4]  // C2, C2, D2, C2
// 8-beat pad pattern
const TITLE_PAD_PAT: (number|null)[] = [0, null, 2, null, 4, null, 2, null]
const TITLE_TOP_PAT: (number|null)[] = [null, 6, null, 5, null, 4, null, 6]

const titleTrack = makeTrack()

function scheduleTitle(track: MusicTrack, vol: number, beatSec: number, upTo: number): void {
  while (track.nextBeatTime < upTo) {
    const beat = track.beatIndex % 8
    const t    = track.nextBeatTime
    const n    = (f: number, type: OscillatorType, off: number, dur: number, v: number) =>
                   musicNote(track, vol, f, type, t + off, dur, v)

    // Slow bass every 2 beats
    if (beat % 2 === 0) n(TITLE_BASS[beat / 2 % 4], 'sine', 0, beatSec * 1.8, 0.4)

    const padIdx = TITLE_PAD_PAT[beat]
    if (padIdx !== null) n(TITLE_PADS[padIdx], 'triangle', 0, beatSec * 1.4, 0.35)

    const topIdx = TITLE_TOP_PAT[beat]
    if (topIdx !== null) n(TITLE_PADS[topIdx] * 2, 'sine', beatSec * 0.1, beatSec * 0.9, 0.25)

    track.nextBeatTime += beatSec
    track.beatIndex++
  }
}

export function startTitleMusic(): void {
  startTrack(titleTrack, TITLE_VOL, TITLE_BEAT_SEC, scheduleTitle, stopTitleMusic)
}
export function stopTitleMusic(): void { stopTrack(titleTrack) }

// ─── Game Over Music ──────────────────────────────────────────────────────────
// Victory: G major, ascending, upbeat 80 BPM
// Defeat:  D minor, descending, slow 55 BPM

const goTrack = makeTrack()

// G major pentatonic: G3, A3, B3, D4, E4, G4
const WIN_NOTES  = [196.0, 220.0, 246.9, 293.7, 329.6, 392.0]
const WIN_PAT: (number|null)[] = [0, null, 2, null, 4, 5, 3, null]
// D minor pentatonic: D3, F3, G3, A3, C4
const LOSE_NOTES  = [146.8, 174.6, 196.0, 220.0, 261.6]
const LOSE_PAT: (number|null)[] = [4, null, 3, null, 2, null, 1, 0]

let goIsVictory = false

function scheduleGameOver(track: MusicTrack, vol: number, beatSec: number, upTo: number): void {
  const notes = goIsVictory ? WIN_NOTES : LOSE_NOTES
  const pat   = goIsVictory ? WIN_PAT   : LOSE_PAT
  while (track.nextBeatTime < upTo) {
    const beat = track.beatIndex % 8
    const t    = track.nextBeatTime
    const n    = (f: number, type: OscillatorType, off: number, dur: number, v: number) =>
                   musicNote(track, vol, f, type, t + off, dur, v)

    // Bass root every 4 beats
    if (beat % 4 === 0) {
      const root = goIsVictory ? 98.0 : 73.4
      n(root, 'sine', 0, beatSec * 3.5, 0.4)
      n(root / 2, 'sine', 0, beatSec * 3.5, 0.25)
    }

    const idx = pat[beat]
    if (idx !== null) {
      n(notes[idx], goIsVictory ? 'sine' : 'triangle', beatSec * 0.02, beatSec * 0.75, 0.5)
      // Harmony a third above on win
      if (goIsVictory && idx + 2 < notes.length) {
        n(notes[idx + 2], 'sine', beatSec * 0.02, beatSec * 0.65, 0.25)
      }
    }

    track.nextBeatTime += beatSec
    track.beatIndex++
  }
}

export function startGameOverMusic(winner: 'player' | 'opponent' | 'draw'): void {
  goIsVictory = winner === 'player'
  const bpm     = goIsVictory ? 80 : 55
  const beatSec = 60 / bpm
  startTrack(goTrack, 0.11, beatSec, scheduleGameOver, stopGameOverMusic)
}
export function stopGameOverMusic(): void { stopTrack(goTrack) }

// ─── Node Map Music (E minor, mysterious, 70 BPM) ─────────────────────────────
// Wandering, slightly eerie — suits the between-battle map exploration.

const MAP_BPM      = 70
const MAP_BEAT_SEC = 60 / MAP_BPM
const MAP_VOL      = 0.10

// E minor pentatonic: E2(bass), B2, D3, E3, G3, B3, D4, E4
const MAP_BASS  = [82.4, 82.4, 97.9, 82.4]   // E2, E2, B2, E2
const MAP_PADS  = [146.8, 164.8, 196.0, 246.9, 293.7, 329.6]
const MAP_PAD_PAT: (number|null)[] = [0, null, 2, 3, null, 4, null, 1]
const MAP_TOP_PAT: (number|null)[] = [null, 5, null, null, 4, null, 5, null]

const mapTrack = makeTrack()

function scheduleMap(track: MusicTrack, vol: number, beatSec: number, upTo: number): void {
  while (track.nextBeatTime < upTo) {
    const beat = track.beatIndex % 8
    const t    = track.nextBeatTime
    const n    = (f: number, type: OscillatorType, off: number, dur: number, v: number) =>
                   musicNote(track, vol, f, type, t + off, dur, v)

    // Bass on beats 0 and 4
    if (beat === 0 || beat === 4) {
      n(MAP_BASS[beat === 0 ? 0 : 2], 'sine', 0, beatSec * 1.9, 0.45)
      n(MAP_BASS[beat === 0 ? 0 : 2] / 2, 'sine', 0, beatSec * 1.9, 0.2)
    }

    const padIdx = MAP_PAD_PAT[beat]
    if (padIdx !== null) n(MAP_PADS[padIdx], 'triangle', 0, beatSec * 1.2, 0.3)

    const topIdx = MAP_TOP_PAT[beat]
    if (topIdx !== null) n(MAP_PADS[topIdx] * 2, 'sine', beatSec * 0.08, beatSec * 0.7, 0.2)

    track.nextBeatTime += beatSec
    track.beatIndex++
  }
}

export function startMapMusic(): void {
  startTrack(mapTrack, MAP_VOL, MAP_BEAT_SEC, scheduleMap, stopMapMusic)
}
export function stopMapMusic(): void { stopTrack(mapTrack) }
