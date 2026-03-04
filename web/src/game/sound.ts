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

// ─── Background Music ─────────────────────────────────────────────────────────
// Look-ahead scheduler: every SCHEDULE_INTERVAL_MS we schedule any beats
// that fall within the next LOOKAHEAD_SEC seconds of audio time.

const BPM           = 95
const BEAT_SEC      = 60 / BPM
const LOOKAHEAD_SEC = 0.3
const SCHEDULE_MS   = 100

// A minor pentatonic: A2, C3, D3, E3, G3
const BASS_NOTES  = [110.0, 130.8, 146.8, 164.8, 196.0]
// Upper register melody (same scale, 2 octaves up)
const MELODY_NOTES = [440.0, 523.2, 587.3, 659.3, 784.0]

// 8-beat pattern (indices into BASS_NOTES / MELODY_NOTES)
// bass: plays on every beat; melody: sparse fills
const BASS_PAT:   number[] = [0, 0, 2, 0, 3, 0, 2, 1]
const MELODY_PAT: (number | null)[] = [0, null, null, 2, null, 3, null, null]

let bgScheduler: ReturnType<typeof setInterval> | null = null
let bgNextBeatTime  = 0
let bgBeatIndex     = 0
let bgMusicGain: GainNode | null = null

function getBgGain(): GainNode | null {
  const c = getCtx()
  if (!c) return null
  if (!bgMusicGain) {
    bgMusicGain = c.createGain()
    bgMusicGain.gain.value = 0.12   // softer than SFX master (0.35)
    bgMusicGain.connect(c.destination)
  }
  return bgMusicGain
}

function bgNote(freq: number, type: OscillatorType, startT: number, dur: number, vol: number): void {
  const c = getCtx()
  const g = getBgGain()
  if (!c || !g) return
  const osc = c.createOscillator()
  const gn  = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startT)
  gn.gain.setValueAtTime(vol, startT)
  gn.gain.exponentialRampToValueAtTime(0.001, startT + dur)
  osc.connect(gn)
  gn.connect(g)
  osc.start(startT)
  osc.stop(startT + dur + 0.05)
}

function scheduleBgBeats(upTo: number): void {
  while (bgNextBeatTime < upTo) {
    const beat = bgBeatIndex % 8

    // Bass: sawtooth on every beat, long note
    bgNote(BASS_NOTES[BASS_PAT[beat]], 'sawtooth', bgNextBeatTime, BEAT_SEC * 0.85, 0.5)

    // Sub-bass octave below for warmth
    bgNote(BASS_NOTES[BASS_PAT[beat]] / 2, 'sine', bgNextBeatTime, BEAT_SEC * 0.9, 0.3)

    // Melody: sparse, on certain beats only
    const melIdx = MELODY_PAT[beat]
    if (melIdx !== null) {
      bgNote(MELODY_NOTES[melIdx], 'sine', bgNextBeatTime + BEAT_SEC * 0.05, BEAT_SEC * 0.55, 0.4)
    }

    // Snare-like accent on beats 2 and 6 (noise burst via high-freq square)
    if (beat === 2 || beat === 6) {
      bgNote(3000 + Math.random() * 1000, 'square', bgNextBeatTime, 0.04, 0.08)
      bgNote(2000 + Math.random() * 800,  'square', bgNextBeatTime, 0.06, 0.06)
    }

    bgNextBeatTime += BEAT_SEC
    bgBeatIndex++
  }
}

export function startBattleMusic(): void {
  if (bgScheduler !== null) return
  const c = getCtx()
  if (!c) return
  bgNextBeatTime = c.currentTime + 0.1
  bgBeatIndex    = 0
  bgScheduler    = setInterval(() => {
    const c2 = getCtx()
    if (!c2 || !isSoundEnabled()) { stopBattleMusic(); return }
    scheduleBgBeats(c2.currentTime + LOOKAHEAD_SEC)
  }, SCHEDULE_MS)
}

export function stopBattleMusic(): void {
  if (bgScheduler !== null) {
    clearInterval(bgScheduler)
    bgScheduler = null
  }
}
