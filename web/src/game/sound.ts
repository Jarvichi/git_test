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
