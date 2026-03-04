import React, { useState } from 'react'
import { EventData, EventChoice } from '../game/questline'

interface Props {
  event: EventData
  onChoice: (choice: EventChoice) => void
}

export function EventScreen({ event, onChoice }: Props) {
  const [picked, setPicked] = useState<EventChoice | null>(null)

  function handlePick(choice: EventChoice) {
    if (picked) return
    setPicked(choice)
    // Brief pause so the result text reads before continuing
    setTimeout(() => onChoice(choice), 1400)
  }

  return (
    <div className="event-screen">
      <div className="event-type-tag">[EVENT]</div>
      <div className="event-title">{event.title}</div>
      <div className="event-description">{event.description}</div>

      <div className="event-choices">
        {event.choices.map((choice, i) => {
          const isChosen = picked?.label === choice.label
          const isDisabled = picked !== null && !isChosen
          return (
            <button
              key={i}
              className={[
                'event-choice',
                isChosen  ? 'event-choice--chosen'   : '',
                isDisabled ? 'event-choice--disabled' : '',
              ].join(' ')}
              onClick={() => handlePick(choice)}
              disabled={isDisabled}
            >
              <span className="event-choice-letter">{String.fromCharCode(65 + i)}.</span>
              <span className="event-choice-label">{choice.label}</span>
              <span className="event-choice-consequence">→ {choice.consequence}</span>
            </button>
          )
        })}
      </div>

      {picked && (
        <div className="event-result">
          {picked.effect.type === 'nothing'
            ? picked.consequence
            : `${picked.consequence}…`}
        </div>
      )}
    </div>
  )
}
