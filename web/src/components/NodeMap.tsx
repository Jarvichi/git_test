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

// ── Connector component ─────────────────────────────────────────────────────
// Uses the same CSS grid as the node rows so vertical lines align perfectly.

interface ConnProps {
  prevRow: QuestNode[]
  nextRow: QuestNode[]
  maxCols: number
}

function NodeConnector({ prevRow, nextRow, maxCols }: ConnProps) {
  const center = Math.floor(maxCols / 2)  // 0-indexed center slot

  const isStraight = prevRow.length === 1 && nextRow.length === 1
  const singleUp   = prevRow.length === 1 && nextRow.length > 1
  const singleDown = prevRow.length > 1   && nextRow.length === 1

  // Which 0-indexed columns have a connection above / below
  const aboveCols = new Set<number>(
    isStraight || singleDown
      ? [center]
      : prevRow.map(n => n.col),
  )
  const belowCols = new Set<number>(
    isStraight || singleUp
      ? [center]
      : nextRow.map(n => n.col),
  )

  // The horizontal bar spans from the leftmost to rightmost active column
  const allActive  = [...aboveCols, ...belowCols]
  const minActive  = Math.min(...allActive)
  const maxActive  = Math.max(...allActive)

  return (
    <div
      className="nm-conn"
      style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}
    >
      {Array.from({ length: maxCols }, (_, i) => {
        const above  = aboveCols.has(i)
        const below  = belowCols.has(i)
        const inHBar = !isStraight && i >= minActive && i <= maxActive
        const hStart = inHBar && i === minActive
        const hEnd   = inHBar && i === maxActive

        return (
          <div key={i} className="nm-conn-slot">
            {above && <div className="nm-conn-v nm-conn-v--top" />}
            {inHBar && (
              <div className={[
                'nm-conn-h',
                hStart ? 'nm-conn-h--s' : '',
                hEnd   ? 'nm-conn-h--e' : '',
              ].filter(Boolean).join(' ')} />
            )}
            {below && <div className="nm-conn-v nm-conn-v--bot" />}
          </div>
        )
      })}
    </div>
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
      </div>

      {/* Map */}
      <div className="nm-map">
        <div className="nm-map-inner">
          {rows.map((rowNodes, rowIndex) => {
            return (
              <React.Fragment key={rowIndex}>
                {/* Connector above this row */}
                {rowIndex > 0 && (
                  <NodeConnector
                    prevRow={rows[rowIndex - 1]}
                    nextRow={rowNodes}
                    maxCols={maxCols}
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
