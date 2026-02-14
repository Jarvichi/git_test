import React from 'react'
import { GameState } from '../game/types'
import { renderPathMap } from '../game/engine'

interface Props {
  state: GameState
  movementTargets: string[]
  onSelectDestination: (nodeId: string) => void
}

export function PathMap({ state, movementTargets, onSelectDestination }: Props) {
  return (
    <div className="path-map">
      <div className="path-header">
        ═══ PATH: Step {state.currentStep}/10 ═══
      </div>
      <div className="path-message">{state.message}</div>
      <pre className="path-ascii">{renderPathMap(state)}</pre>

      {movementTargets.length > 0 && (
        <div className="destination-picker">
          <div className="destination-header">── Choose Destination ──</div>
          {movementTargets.map(nodeId => {
            const node = state.allNodes.find(n => n.id === nodeId)
            if (!node) return null
            const sym = node.spaceType === 'battle' ? '[X]'
              : node.spaceType === 'reward' ? '[R]'
              : node.spaceType === 'boss' ? '[!]'
              : '[@]'
            const label = node.spaceType === 'battle' ? 'Battle'
              : node.spaceType === 'reward' ? 'Reward'
              : node.spaceType === 'boss' ? 'BOSS'
              : 'Start'
            return (
              <button
                key={nodeId}
                className="destination-btn"
                onClick={() => onSelectDestination(nodeId)}
              >
                &gt;&gt; {sym} Step {node.step} - {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
