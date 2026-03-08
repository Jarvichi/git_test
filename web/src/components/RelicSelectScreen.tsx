import React, { useState } from 'react'
import { getRelicDef } from '../game/relics'

interface Props {
  earnedRelics: string[]        // names of all relics the player has collected
  currentRelic: string | null   // currently equipped relic (if resuming)
  onSelect: (relicName: string | null) => void
}

export function RelicSelectScreen({ earnedRelics, currentRelic, onSelect }: Props) {
  const [picked, setPicked] = useState<string | null>(currentRelic ?? (earnedRelics[0] ?? null))

  const defs = earnedRelics.map(name => ({ name, def: getRelicDef(name) })).filter(r => r.def)

  return (
    <div className="relic-select-screen">
      <div className="relic-select-header">
        <div className="relic-select-title">CHOOSE YOUR RELIC</div>
        <div className="relic-select-subtitle">
          One relic may be equipped per run. Its effect applies at the start of every battle.
        </div>
      </div>

      <div className="relic-select-grid">
        {defs.map(({ name, def }) => (
          <button
            key={name}
            className={`relic-select-card${picked === name ? ' relic-select-card--chosen' : ''}`}
            onClick={() => setPicked(name)}
          >
            <div className="relic-select-icon">{def!.icon}</div>
            <div className="relic-select-name">{def!.name}</div>
            <div className="relic-select-desc">{def!.desc}</div>
          </button>
        ))}

        <button
          className={`relic-select-card relic-select-card--none${picked === null ? ' relic-select-card--chosen' : ''}`}
          onClick={() => setPicked(null)}
        >
          <div className="relic-select-icon">✕</div>
          <div className="relic-select-name">No Relic</div>
          <div className="relic-select-desc">Enter without a relic. Face the shard on your own merits.</div>
        </button>
      </div>

      <button
        className="action-btn action-btn--large relic-select-confirm"
        onClick={() => onSelect(picked)}
      >
        {picked ? `EQUIP ${getRelicDef(picked)?.name ?? picked}` : 'ENTER WITHOUT RELIC'} →
      </button>
    </div>
  )
}
