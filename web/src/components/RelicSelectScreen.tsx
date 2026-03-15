import React, { useState } from 'react'
import { getRelicDef } from '../game/relics'
import brokenRelicsData from '../data/broken-relics.json'

const BROKEN_RELIC_ITEMS = Object.fromEntries(
  (brokenRelicsData as { relicName: string; name: string; icon: string; desc: string }[])
    .map(r => [r.relicName, r])
)

interface Props {
  earnedRelics: string[]        // names of all usable relics the player has collected
  brokenRelics?: string[]       // names of relics that are currently broken (shown greyed-out)
  currentRelic: string | null   // currently equipped relic (if resuming)
  brokenRelic?: { name: string; icon: string } | null  // relic that just broke this act
  onSelect: (relicName: string | null) => void
}

export function RelicSelectScreen({ earnedRelics, brokenRelics = [], currentRelic, brokenRelic, onSelect }: Props) {
  const [picked, setPicked] = useState<string | null>(currentRelic ?? (earnedRelics[0] ?? null))

  const defs       = earnedRelics.map(name => ({ name, def: getRelicDef(name) })).filter(r => r.def)
  const brokenDefs = brokenRelics.map(name => ({
    name,
    def: getRelicDef(name),
    brokenItem: BROKEN_RELIC_ITEMS[name],
  })).filter(r => r.def || r.brokenItem)

  return (
    <div className="relic-select-screen">
      {brokenRelic && (
        <div className="relic-broken-notice">
          <span className="relic-broken-icon">{brokenRelic.icon}</span>
          <div className="relic-broken-text">
            <strong>{brokenRelic.name}</strong> shattered at the end of this act.
            <br />It has been added to your inventory as a broken relic.
          </div>
        </div>
      )}

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

        {brokenDefs.length > 0 && (
          <>
            <div className="relic-select-broken-divider">— BROKEN (re-earn by completing the rewarding act) —</div>
            {brokenDefs.map(({ name, def, brokenItem }) => (
              <div key={name} className="relic-select-card relic-select-card--broken" aria-disabled="true">
                <div className="relic-select-icon relic-select-icon--broken">
                  {brokenItem?.icon ?? def?.icon ?? '🪨'}
                </div>
                <div className="relic-select-name relic-select-name--broken">
                  {brokenItem?.name ?? `Cracked ${def?.name ?? name}`}
                </div>
                <div className="relic-select-desc relic-select-desc--broken">
                  {brokenItem?.desc ?? def?.desc}
                </div>
              </div>
            ))}
          </>
        )}
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
