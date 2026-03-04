import React, { useState } from 'react'

interface Props {
  /** Top 3 most-played card names for this act — candidates to rest. */
  candidates: string[]
  /** Plays-per-card for display (keyed by name). */
  playCounts: Record<string, number>
  onConfirm: (resting: string[]) => void
}

export function CardRestSelect({ candidates, playCounts, onConfirm }: Props) {
  const required = Math.min(2, candidates.length)
  // Pre-select the top `required` candidates
  const [selected, setSelected] = useState<Set<string>>(
    new Set(candidates.slice(0, required))
  )

  function toggle(name: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        // Can always deselect unless it would drop below required
        if (next.size > required) next.delete(name)
      } else {
        if (next.size < required) next.add(name)
      }
      return next
    })
  }

  const ready = selected.size === required

  return (
    <div className="overlay-screen card-rest-screen">
      <div className="card-rest-header">
        <div className="card-rest-title">TROOPS NEED REST</div>
        <div className="card-rest-sub">
          Your most-relied-upon troops must recover between acts.<br />
          Pick <strong>{required}</strong> card{required !== 1 ? 's' : ''} to rest for the next act.
          They will be unavailable in your deck until the act after.
        </div>
      </div>

      <div className="card-rest-candidates">
        {candidates.map((name, i) => {
          const isSelected = selected.has(name)
          const canToggle = isSelected
            ? selected.size > required  // can only deselect if we have more than required
            : selected.size < required  // can only select if room remains
          return (
            <div
              key={name}
              className={[
                'card-rest-candidate',
                isSelected ? 'card-rest-candidate--selected' : '',
                !canToggle && !isSelected ? 'card-rest-candidate--locked' : '',
              ].join(' ')}
              onClick={() => canToggle || isSelected ? toggle(name) : undefined}
            >
              <div className="crc-checkbox">{isSelected ? '[✓]' : '[ ]'}</div>
              <div className="crc-rank">#{i + 1} most used</div>
              <div className="crc-name">{name}</div>
              <div className="crc-count">×{playCounts[name] ?? 0} plays this act</div>
            </div>
          )
        })}
      </div>

      <div className="card-rest-footer">
        <div className="card-rest-note">
          Rested cards show as [RESTING] in the Deck Builder and can't be added to your deck.
        </div>
        <button
          className="action-btn action-btn--large"
          disabled={!ready}
          onClick={() => onConfirm(Array.from(selected))}
        >
          REST {selected.size} CARD{selected.size !== 1 ? 'S' : ''}
        </button>
      </div>
    </div>
  )
}
