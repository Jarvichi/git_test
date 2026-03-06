import React, { useState } from 'react'
import { isSoundEnabled, setSoundEnabled } from '../game/sound'

interface Props {
  onBack: () => void
  onResetGame: () => void
}

const TEXT_SIZE_KEY  = 'jarv_text_size'
const TEXT_COLOR_KEY = 'jarv_text_color'
const SKIP_INTRO_KEY = 'jarv_skip_intro'

export function loadSkipIntro(): boolean {
  try { return localStorage.getItem(SKIP_INTRO_KEY) === 'true' }
  catch { return false }
}

export function saveSkipIntro(val: boolean): void {
  try { localStorage.setItem(SKIP_INTRO_KEY, String(val)) } catch { /* ignore */ }
}

export function loadTextSize(): number {
  try { return parseFloat(localStorage.getItem(TEXT_SIZE_KEY) ?? '14') || 14 }
  catch { return 14 }
}

export function loadTextColor(): string {
  try { return localStorage.getItem(TEXT_COLOR_KEY) ?? '#33ff33' }
  catch { return '#33ff33' }
}

export function applyTextSettings(): void {
  const size  = loadTextSize()
  const color = loadTextColor()
  document.documentElement.style.setProperty('--game-font-size', `${size}px`)
  document.documentElement.style.setProperty('--game-text-color', color)
}

const TEXT_COLOR_PRESETS = [
  { label: 'Terminal Green', value: '#33ff33' },
  { label: 'Amber',          value: '#ffbb33' },
  { label: 'Cyan',           value: '#33ddff' },
  { label: 'White',          value: '#e8e8e8' },
  { label: 'Pink',           value: '#ff88cc' },
]

export function SettingsScreen({ onBack, onResetGame }: Props) {
  const [soundOn,    setSoundOn]    = useState(isSoundEnabled)
  const [textSize,   setTextSize]   = useState(loadTextSize)
  const [textColor,  setTextColor]  = useState(loadTextColor)
  const [skipIntro,  setSkipIntro]  = useState(loadSkipIntro)
  const [confirmReset, setConfirmReset] = useState(false)

  function handleSoundToggle() {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
  }

  function handleSkipIntroToggle() {
    const next = !skipIntro
    setSkipIntro(next)
    saveSkipIntro(next)
  }

  function handleSizeChange(val: number) {
    setTextSize(val)
    try { localStorage.setItem(TEXT_SIZE_KEY, String(val)) } catch { /* ignore */ }
    document.documentElement.style.setProperty('--game-font-size', `${val}px`)
  }

  function handleColorChange(val: string) {
    setTextColor(val)
    try { localStorage.setItem(TEXT_COLOR_KEY, val) } catch { /* ignore */ }
    document.documentElement.style.setProperty('--game-text-color', val)
  }

  function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return }
    onResetGame()
  }

  return (
    <div className="settings-screen">
      <div className="overlay-header">
        <button className="action-btn" onClick={onBack}>← BACK</button>
        <span className="overlay-title">SETTINGS</span>
      </div>

      <div className="settings-body">
        {/* Audio */}
        <div className="settings-section">
          <div className="settings-section-title">AUDIO</div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Sound effects</div>
              <div className="settings-sublabel">Procedurally generated audio</div>
            </div>
            <div className="settings-toggle" onClick={handleSoundToggle}>
              <div className={`settings-toggle-track${soundOn ? ' settings-toggle-track--on' : ''}`}>
                <div className="settings-toggle-thumb" />
              </div>
            </div>
          </div>
        </div>

        {/* Intro */}
        <div className="settings-section">
          <div className="settings-section-title">STARTUP</div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Skip intro on startup</div>
              <div className="settings-sublabel">Skip the Awesome Software splash screens</div>
            </div>
            <div className="settings-toggle" onClick={handleSkipIntroToggle}>
              <div className={`settings-toggle-track${skipIntro ? ' settings-toggle-track--on' : ''}`}>
                <div className="settings-toggle-thumb" />
              </div>
            </div>
          </div>
        </div>

        {/* Display */}
        <div className="settings-section">
          <div className="settings-section-title">DISPLAY</div>

          <div className="settings-row">
            <div>
              <div className="settings-label">Text size</div>
              <div className="settings-sublabel">{textSize}px</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                className="settings-slider"
                min={11}
                max={18}
                step={1}
                value={textSize}
                onChange={e => handleSizeChange(Number(e.target.value))}
              />
              <span className="settings-value">{textSize}px</span>
            </div>
          </div>

          <div className="settings-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div className="settings-label">Text colour</div>
              <div className="settings-sublabel">Choose a terminal palette</div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {TEXT_COLOR_PRESETS.map(p => (
                <button
                  key={p.value}
                  className={`filter-btn${textColor === p.value ? ' filter-btn--active' : ''}`}
                  style={textColor === p.value ? { borderColor: p.value, color: p.value } : { color: p.value, borderColor: p.value + '66' }}
                  onClick={() => handleColorChange(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Game data */}
        <div className="settings-section">
          <div className="settings-section-title">GAME DATA</div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Reset all progress</div>
              <div className="settings-sublabel">Clears collection, deck, crystals, campaign and stats</div>
            </div>
            {confirmReset ? (
              <div className="settings-confirm-row">
                <span className="settings-confirm-msg">Are you sure? This cannot be undone.</span>
                <button className="action-btn settings-danger-btn" onClick={handleReset}>CONFIRM RESET</button>
                <button className="action-btn" onClick={() => setConfirmReset(false)} style={{ fontSize: '11px', padding: '6px 12px' }}>CANCEL</button>
              </div>
            ) : (
              <button className="action-btn settings-danger-btn" onClick={handleReset}>
                RESET GAME
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="settings-section">
          <div className="settings-section-title">ABOUT</div>
          <div className="settings-row">
            <div>
              <div className="settings-label">Jarv's Amazing Web Game</div>
              <div className="settings-sublabel">A browser-based strategy card game</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
