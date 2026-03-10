import React, { useMemo } from 'react'
import { Act, QuestNode, RunState, getAvailableNodeIds } from '../game/questline'

interface Props {
  act: Act
  run: RunState
  onSelectNode: (node: QuestNode) => void
  onBack: () => void
}

const NODE_ICON: Record<string, string> = {
  battle:   '⚔',
  elite:    '★',
  boss:     '☠',
  rest:     '⛺',
  event:    '?',
  merchant: '⚖',
}

const NODE_LABEL: Record<string, string> = {
  battle:   'BATTLE',
  elite:    'ELITE',
  boss:     'BOSS',
  rest:     'REST',
  event:    'EVENT',
  merchant: 'SHOP',
}

type NodeStatus = 'completed' | 'available' | 'skipped' | 'locked' | 'pending'

function getNodeStatus(
  nodeId: string,
  availableIds: string[],
  run: RunState,
): NodeStatus {
  if (run.pendingNodeId === nodeId)          return 'pending'
  if (run.completedNodeIds.includes(nodeId)) return 'completed'
  if (run.skippedNodeIds.includes(nodeId))   return 'skipped'
  if (availableIds.includes(nodeId))         return 'available'
  return 'locked'
}

function hpColor(hp: number, max: number): string {
  const pct = hp / max
  if (pct > 0.6) return '#33ff33'
  if (pct > 0.3) return '#ffcc00'
  return '#ff4444'
}

// Rows sorted top→bottom (row 0 first; boss last)
function buildRows(act: Act): QuestNode[][] {
  const byRow: Record<number, QuestNode[]> = {}
  for (const node of Object.values(act.nodes)) {
    if (!byRow[node.row]) byRow[node.row] = []
    byRow[node.row].push(node)
  }
  return Object.keys(byRow)
    .map(Number)
    .sort((a, b) => a - b)
    .map(r => byRow[r].sort((a, b) => a.col - b.col))
}

// ── SVG connector ────────────────────────────────────────────────────────────
// Renders the linking lines between two adjacent rows.
// Uses the explicit parentIds/childIds graph rather than inferring topology
// from row lengths. viewBox is maxCols×1 so column centres sit at col+0.5,
// matching the 1fr CSS grid columns exactly. vectorEffect="non-scaling-stroke"
// keeps the stroke at a fixed 2px regardless of viewBox scaling.

interface ConnProps {
  prevRow: QuestNode[]
  nextRow: QuestNode[]
  maxCols: number
  center: number   // visual column for single-node rows
}

function SVGConnector({ prevRow, nextRow, maxCols, center }: ConnProps) {
  const visualCol = (node: QuestNode, row: QuestNode[]) =>
    row.length === 1 ? center : node.col

  const prevById = new Map(prevRow.map(n => [n.id, n]))

  // Build (parentVisualCol, childVisualCol) pairs from explicit graph edges
  const connections: [number, number][] = []
  for (const child of nextRow) {
    for (const parentId of child.parentIds) {
      const parent = prevById.get(parentId)
      if (parent) connections.push([visualCol(parent, prevRow), visualCol(child, nextRow)])
    }
  }

  if (connections.length === 0) return null

  // Column i centre in viewBox units (viewBox is maxCols wide, 1 tall)
  const cx = (col: number) => col + 0.5

  // Deduplicate identical paths (same parent col → same child col)
  const seen = new Set<string>()
  const unique = connections.filter(([pc, cc]) => {
    const k = `${pc}:${cc}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  return (
    <svg
      viewBox={`0 0 ${maxCols} 1`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: '40px', display: 'block', overflow: 'visible' }}
    >
      {unique.map(([pc, cc], i) => (
        <polyline
          key={i}
          // Down to midpoint → across → down to bottom
          points={`${cx(pc)},0 ${cx(pc)},0.5 ${cx(cc)},0.5 ${cx(cc)},1`}
          fill="none"
          stroke="#4a4a4a"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function NodeMap({ act, run, onSelectNode, onBack }: Props) {
  const availableIds = getAvailableNodeIds(act, run)
  const rows         = useMemo(() => buildRows(act), [act])
  const maxCols      = useMemo(() => Math.max(...rows.map(r => r.length)), [rows])
  const hpPct        = Math.max(0, run.playerHp / run.maxHp)
  const center       = Math.floor(maxCols / 2)  // 0-indexed

  const gridCols = `repeat(${maxCols}, 1fr)`

  return (
    <div className="nodemap">
      {/* Header */}
      <div className="nm-header">
        <div className="nm-act-label">
          <span className="nm-act-title">{act.title}</span>
          <span className="nm-act-sub">{act.subtitle}</span>
        </div>
        <div className="nm-hp-area">
          <span className="nm-hp-label">HP</span>
          <div className="nm-hp-track">
            <div
              className="nm-hp-fill"
              style={{ width: `${hpPct * 100}%`, background: hpColor(run.playerHp, run.maxHp) }}
            />
          </div>
          <span className="nm-hp-text" style={{ color: hpColor(run.playerHp, run.maxHp) }}>
            {run.playerHp}/{run.maxHp}
          </span>
        </div>
        <div className="nm-lives-area" title="Lives remaining — lose them all and the campaign ends">
          {Array.from({ length: run.maxLives ?? 3 }).map((_, i) => (
            <span key={i} className={`nm-life-pip ${i < (run.livesRemaining ?? 3) ? 'nm-life-pip--full' : 'nm-life-pip--empty'}`}>♥</span>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="nm-map">
        <div className="nm-map-inner">
          {rows.map((rowNodes, rowIndex) => {
            return (
              <React.Fragment key={rowIndex}>
                {/* Connector above this row */}
                {rowIndex > 0 && (
                  <SVGConnector
                    prevRow={rows[rowIndex - 1]}
                    nextRow={rowNodes}
                    maxCols={maxCols}
                    center={center}
                  />
                )}

                {/* Row of nodes */}
                <div className="nm-row" style={{ gridTemplateColumns: gridCols }}>
                  {rowNodes.map((node) => {
                    const status   = getNodeStatus(node.id, availableIds, run)
                    const clickable = status === 'available'
                    // Single-node rows are always centred; multi-node rows use col
                    const gridCol  = rowNodes.length === 1 ? center + 1 : node.col + 1

                    return (
                      <div
                        key={node.id}
                        style={{ gridColumn: gridCol, display: 'flex', justifyContent: 'center' }}
                      >
                        <button
                          className={[
                            'nm-node',
                            `nm-node--${node.type}`,
                            `nm-node--${status}`,
                          ].join(' ')}
                          onClick={clickable ? () => onSelectNode(node) : undefined}
                          disabled={!clickable}
                          title={node.description}
                        >
                          <span className={`nm-node-type-badge nm-node-type-badge--${node.type}`}>
                            {NODE_LABEL[node.type] ?? node.type.toUpperCase()}
                          </span>
                          <span className="nm-node-icon">{NODE_ICON[node.type] ?? '?'}</span>
                          <span className="nm-node-name">{node.label}</span>
                          <span className="nm-node-status">
                            {status === 'completed' && '✓'}
                            {status === 'pending'   && '…'}
                            {status === 'skipped'   && '╳'}
                            {status === 'available' && node.type === 'rest'
                              ? `+${node.restHeal} HP`
                              : status === 'available' ? 'ENTER' : ''}
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </div>

      <button className="action-btn nm-back-btn" onClick={onBack}>
        ← MAIN MENU
      </button>
    </div>
  )
}
