import React, { useRef, useLayoutEffect, useState, useCallback } from 'react'
import { GameState, PathNode } from '../game/types'
import { allReachable } from '../game/engine'

interface Props {
  state: GameState
  movementTargets: string[]
  onSelectDestination: (nodeId: string) => void
}

function nodeIcon(node: PathNode): string {
  switch (node.spaceType) {
    case 'start':  return '[@]'
    case 'battle': return '[X]'
    case 'reward': return '[R]'
    case 'boss':   return '[!]'
  }
}

function nodeLabel(node: PathNode): string {
  switch (node.spaceType) {
    case 'start':  return 'Start'
    case 'battle': return 'Battle'
    case 'reward': return 'Reward'
    case 'boss':   return 'BOSS'
  }
}

function typeClass(node: PathNode): string {
  return `path-node--${node.spaceType}`
}

interface LineData {
  x1: number; y1: number; x2: number; y2: number; color: string
}

export function PathMap({ state, movementTargets, onSelectDestination }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map())
  const [lines, setLines] = useState<LineData[]>([])

  const setNodeRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      nodeRefs.current.set(id, el)
    } else {
      nodeRefs.current.delete(id)
    }
  }, [])

  const reachableSet = new Set(allReachable(state.allNodes, state.currentNodeId))
  reachableSet.add(state.currentNodeId)

  const targetSet = new Set(movementTargets)

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const wrapperRect = wrapper.getBoundingClientRect()
    const newLines: LineData[] = []

    for (let step = 0; step < 10; step++) {
      const parentNodes = state.allNodes.filter(n => n.step === step)
      for (const parent of parentNodes) {
        const parentEl = nodeRefs.current.get(parent.id)
        if (!parentEl) continue
        const pRect = parentEl.getBoundingClientRect()
        const px = pRect.left + pRect.width / 2 - wrapperRect.left
        const py = pRect.top - wrapperRect.top

        for (const childId of parent.childIds) {
          const childEl = nodeRefs.current.get(childId)
          if (!childEl) continue
          const cRect = childEl.getBoundingClientRect()
          const cx = cRect.left + cRect.width / 2 - wrapperRect.left
          const cy = cRect.top + cRect.height - wrapperRect.top

          let color = '#333'
          if (parent.id === state.currentNodeId || childId === state.currentNodeId) {
            color = '#ffcc00'
          } else if (reachableSet.has(parent.id) && reachableSet.has(childId)) {
            color = '#33ff33'
          }

          newLines.push({ x1: px, y1: py, x2: cx, y2: cy, color })
        }
      }
    }

    setLines(newLines)
  }, [state.allNodes, state.currentNodeId, state.currentStep])

  // Group nodes by step
  const stepRows: PathNode[][] = []
  for (let step = 0; step <= 10; step++) {
    stepRows[step] = state.allNodes
      .filter(n => n.step === step)
      .sort((a, b) => a.branchIndex - b.branchIndex)
  }

  return (
    <div className="path-map">
      <div className="path-header">
        ═══ PATH: Step {state.currentStep}/10 ═══
      </div>
      <div className="path-message">{state.message}</div>
      <div className="path-grid-wrapper" ref={wrapperRef}>
        <svg className="path-lines" width="100%" height="100%">
          {lines.map((l, i) => {
            const midY = (l.y1 + l.y2) / 2
            const d = `M ${l.x1},${l.y1} C ${l.x1},${midY} ${l.x2},${midY} ${l.x2},${l.y2}`
            return (
              <path
                key={i}
                d={d}
                stroke={l.color}
                strokeWidth={2}
                strokeOpacity={l.color === '#333' ? 0.4 : 0.7}
                fill="none"
              />
            )
          })}
        </svg>
        <div className="path-grid">
          {/* Render step 10 at top down to step 0 at bottom */}
          {[...stepRows].reverse().map((nodes, ri) => {
            const step = 10 - ri
            return (
              <div className="path-row" key={step}>
                {nodes.map(node => {
                  const isCurrent = node.id === state.currentNodeId
                  const isTarget = targetSet.has(node.id)
                  const isVisited = node.isVisited && !isCurrent
                  const isReachable = reachableSet.has(node.id)

                  const classes = [
                    'path-node',
                    typeClass(node),
                    isCurrent && 'path-node--current',
                    isTarget && 'path-node--target',
                    isVisited && 'path-node--visited',
                    !isReachable && !isCurrent && 'path-node--unreachable',
                  ].filter(Boolean).join(' ')

                  if (isTarget) {
                    return (
                      <div className="path-cell" key={node.id}>
                        <button
                          className={classes}
                          onClick={() => onSelectDestination(node.id)}
                          ref={el => setNodeRef(node.id, el)}
                        >
                          <span className="path-node-icon">{nodeIcon(node)}</span>
                          <span className="path-node-label">{nodeLabel(node)}</span>
                        </button>
                      </div>
                    )
                  }

                  return (
                    <div className="path-cell" key={node.id}>
                      <div
                        className={classes}
                        ref={el => setNodeRef(node.id, el)}
                      >
                        <span className="path-node-icon">{nodeIcon(node)}</span>
                        <span className="path-node-label">{nodeLabel(node)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
