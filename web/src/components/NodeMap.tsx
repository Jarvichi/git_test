import React from 'react'
import { Act, QuestNode, RunState, getAvailableNodeIds } from '../game/questline'

interface Props {
  act: Act
  run: RunState
  onSelectNode: (node: QuestNode) => void
  onBack: () => void
}

const NODE_ICON: Record<string, string> = {
  battle: '⚔',
  elite:  '★',
  boss:   '☠',
  rest:   '⛺',
}

type NodeStatus = 'completed' | 'available' | 'skipped' | 'locked' | 'pending'

function getNodeStatus(
  nodeId: string,
  availableIds: string[],
  run: RunState,
): NodeStatus {
  if (run.pendingNodeId === nodeId)         return 'pending'
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

// Returns true if two consecutive rows have a branch/merge between them
function isBranchRow(rows: QuestNode[][], rowIndex: number): boolean {
  if (rowIndex < 0 || rowIndex >= rows.length - 1) return false
  const thisRow = rows[rowIndex]
  const nextRow = rows[rowIndex + 1]
  return thisRow.length > 1 || nextRow.length > 1
}

export function NodeMap({ act, run, onSelectNode, onBack }: Props) {
  const availableIds = getAvailableNodeIds(act, run)
  const rows = buildRows(act)
  const hpPct = Math.max(0, run.playerHp / run.maxHp)

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
        {rows.map((rowNodes, rowIndex) => {
          const isLast = rowIndex === rows.length - 1
          const branch = isBranchRow(rows, rowIndex)
          const prevBranch = rowIndex > 0 && isBranchRow(rows, rowIndex - 1)
          const multiNode = rowNodes.length > 1

          return (
            <React.Fragment key={rowIndex}>
              {/* Connector above this row */}
              {rowIndex > 0 && (
                <div className={`nm-connector ${prevBranch || multiNode ? 'nm-connector--merge' : 'nm-connector--straight'}`}>
                  {(prevBranch || multiNode) ? (
                    <div className="nm-connector-arms">
                      <div className="nm-connector-arm nm-connector-arm--left" />
                      <div className="nm-connector-arm nm-connector-arm--right" />
                    </div>
                  ) : (
                    <div className="nm-connector-line" />
                  )}
                </div>
              )}

              {/* Row of nodes */}
              <div className="nm-row">
                {rowNodes.map(node => {
                  const status = getNodeStatus(node.id, availableIds, run)
                  const clickable = status === 'available'

                  return (
                    <button
                      key={node.id}
                      className={[
                        'nm-node',
                        `nm-node--${node.type}`,
                        `nm-node--${status}`,
                      ].join(' ')}
                      onClick={clickable ? () => onSelectNode(node) : undefined}
                      disabled={!clickable}
                      title={node.description}
                    >
                      <span className="nm-node-icon">{NODE_ICON[node.type]}</span>
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
                  )
                })}
              </div>

              {/* Connector below (split) if this row branches */}
              {!isLast && branch && rowNodes.length === 1 && (
                <div className="nm-connector nm-connector--split">
                  <div className="nm-connector-arms">
                    <div className="nm-connector-arm nm-connector-arm--left" />
                    <div className="nm-connector-arm nm-connector-arm--right" />
                  </div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      <button className="action-btn nm-back-btn" onClick={onBack}>
        ← MAIN MENU
      </button>
    </div>
  )
}
