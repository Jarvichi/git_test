import React, { useState, useEffect } from 'react'
import { UselessItem, loadInventory, _inventorySyncCheck } from '../game/dailyLogin'
import { saveCrystals, loadCrystals } from '../game/collection'

interface Props {
  onBack: () => void
  onCrystalsChanged: (n: number) => void
}

export function InventoryScreen({ onBack, onCrystalsChanged }: Props) {
  const [items, setItems] = useState<UselessItem[]>(loadInventory)
  const [secretMsg, setSecretMsg] = useState<string | null>(null)
  const [secretClaimed, setSecretClaimed] = useState(false)

  // ── inventory sync ───────────────────────────────────────────────────────
  useEffect(() => {
    const payload = _inventorySyncCheck(items)
    if (payload && !secretClaimed) {
      setSecretMsg(payload.msg)
    }
  }, [items, secretClaimed])

  function claimSecret() {
    const payload = _inventorySyncCheck(items)
    if (!payload) return
    const next = loadCrystals() + payload.crystals
    saveCrystals(next)
    onCrystalsChanged(next)
    setSecretClaimed(true)
    setSecretMsg(null)
  }

  return (
    <div className="overlay-screen">
      <div className="overlay-header">
        <button className="action-btn" onClick={onBack}>← BACK</button>
        <span className="overlay-title">INVENTORY</span>
        <span className="inventory-count">{items.length} items</span>
      </div>

      <div className="inventory-intro">
        Items collected from daily logins. Completely useless.
        <br/>
        <span className="inventory-intro-small">
          But... who knows. Keep collecting.
        </span>
      </div>

      {/* Secret panel — appears at 42 items */}
      {secretMsg && (
        <div className="inventory-secret-panel">
          <div className="inventory-secret-icon">🌌</div>
          <div className="inventory-secret-title">DEEP THOUGHT SPEAKS</div>
          <div className="inventory-secret-msg">"{secretMsg}"</div>
          <button className="action-btn action-btn--gold" onClick={claimSecret}>
            CLAIM REWARD
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="inventory-empty">
          Nothing here yet. Come back tomorrow.
        </div>
      ) : (
        <div className="inventory-grid">
          {items.map((item, idx) => (
            <div key={idx} className="inventory-cell" title={`Acquired: ${item.acquiredDate}`}>
              <div className="inventory-item-icon">{item.icon}</div>
              <div className="inventory-item-name">{item.name}</div>
              <div className="inventory-item-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
