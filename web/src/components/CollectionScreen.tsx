import React, { useState } from 'react'
import { Card, CardRarity, CardType } from '../game/types'
import { getCardCatalog } from '../game/cards'
import {
  loadCollection,
  saveCollection,
  saveCrystals,
  getOwnedCount,
  getMasteryXp,
  masteryProgress,
  disenchantCard,
  disenchantAllExtras,
  masterAllExtras,
  CollectionEntry,
  DISENCHANT_VALUE,
  CRYSTAL_PACK_COST,
  COPIES_MAX,
} from '../game/collection'
import { CardTile } from './CardTile'
import { CardDetailModal } from './CardDetailModal'

interface Props {
  crystals: number
  onCrystalsChanged: (n: number) => void
  onBuyCrystalPack: () => void
  onBack: () => void
}

type RarityFilter = 'all' | CardRarity
type TypeFilter   = 'all' | CardType
type SpecialFilter = 'upgradeable'

function MasteryBar({ xp }: { xp: number }) {
  const { level, current, needed } = masteryProgress(xp)
  const pct = needed > 0 ? Math.round((current / needed) * 100) : 100
  return (
    <div className="mastery-bar-wrap">
      <span className="mastery-level">★{level}</span>
      <div className="mastery-bar-track">
        <div className="mastery-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="mastery-xp">{current}/{needed}</span>
    </div>
  )
}

export function CollectionScreen({ crystals, onCrystalsChanged, onBuyCrystalPack, onBack }: Props) {
  const catalog = getCardCatalog()
  const [collection, setCollection] = useState<CollectionEntry[]>(loadCollection)
  const [typeFilter,    setTypeFilter]    = useState<TypeFilter>('all')
  const [rarityFilter,  setRarityFilter]  = useState<RarityFilter>('all')
  const [specialFilter, setSpecialFilter] = useState<SpecialFilter | null>(null)
  const [flash, setFlash]       = useState<string | null>(null)
  const [detailCard, setDetailCard] = useState<Card | null>(null)

  const totalOwned  = collection.reduce((s, e) => s + e.count, 0)
  const totalExtras = collection.reduce((s, e) => s + Math.max(0, e.count - COPIES_MAX), 0)
  const totalUpgradeable = collection.reduce((s, e) => s + (Math.max(0, e.count - COPIES_MAX) > 0 ? 1 : 0), 0)
  const canBuyPack  = crystals >= CRYSTAL_PACK_COST

  const filtered = catalog.filter(c => {
    if (typeFilter   !== 'all' && c.cardType !== typeFilter)   return false
    if (rarityFilter !== 'all' && c.rarity   !== rarityFilter) return false
    if (specialFilter === 'upgradeable') {
      const owned = getOwnedCount(collection, c.name)
      if (Math.max(0, owned - COPIES_MAX) === 0) return false
    }
    return true
  })

  function notify(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(null), 2000)
  }

  function handleDisenchantAll() {
    const { collection: updated, gained } = disenchantAllExtras(collection)
    saveCollection(updated)
    setCollection(updated)
    const next = crystals + gained
    saveCrystals(next)
    onCrystalsChanged(next)
    notify(`+${gained} 💎`)
  }

  function handleMasterAll() {
    let updated = [...collection]
    let totalGained = 0
    for (const entry of collection) {
      const extras = Math.max(0, entry.count - COPIES_MAX)
      if (extras > 0) {
        updated = masterAllExtras(updated, entry.cardName)
        totalGained += extras
      }
    }
    saveCollection(updated)
    setCollection(updated)
    notify(`+${totalGained} mastery XP across all cards!`)
  }

  function handleDisenchantCard(cardName: string) {
    const { collection: updated, gained } = disenchantCard(collection, cardName)
    saveCollection(updated)
    setCollection(updated)
    const next = crystals + gained
    saveCrystals(next)
    onCrystalsChanged(next)
    notify(`+${gained} 💎`)
  }

  function handleMasterCard(cardName: string) {
    const before  = getMasteryXp(collection, cardName)
    const entry   = collection.find(e => e.cardName === cardName)
    const extras  = entry ? Math.max(0, entry.count - COPIES_MAX) : 0
    if (extras === 0) return
    const updated = masterAllExtras(collection, cardName)
    saveCollection(updated)
    setCollection(updated)
    const after = getMasteryXp(updated, cardName)
    const { level: lvlBefore } = masteryProgress(before)
    const { level: lvlAfter  } = masteryProgress(after)
    notify(lvlAfter > lvlBefore
      ? `${cardName} reached Mastery ${lvlAfter}!`
      : `+${extras} mastery XP for ${cardName}`)
  }

  function toggleSpecial() {
    setSpecialFilter(prev => prev === 'upgradeable' ? null : 'upgradeable')
  }

  return (
    <div className="overlay-screen">
      {/* Header */}
      <div className="overlay-header">
        <button className="action-btn" onClick={onBack}>← BACK</button>
        <span className="overlay-title">COLLECTION</span>
        <span className="crystal-count">💎 {crystals.toLocaleString()}</span>
      </div>

      {/* Action row */}
      <div className="collection-action-row">
        <button
          className="action-btn collection-disenchant-btn"
          onClick={handleDisenchantAll}
          disabled={totalExtras === 0}
        >
          🔮 Disenchant extras ({totalExtras})
        </button>
        <button
          className="action-btn collection-master-btn"
          onClick={handleMasterAll}
          disabled={totalUpgradeable === 0}
          title="Convert all extra copies into mastery XP"
        >
          ★ Upgrade all ({totalUpgradeable})
        </button>
        <button
          className="action-btn collection-pack-btn"
          onClick={canBuyPack ? onBuyCrystalPack : undefined}
          disabled={!canBuyPack}
        >
          🎁 Pack ({CRYSTAL_PACK_COST} 💎)
        </button>
        {flash && <span className="collection-flash">{flash}</span>}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        {(['all', 'unit', 'structure', 'upgrade'] as const).map(t => (
          <button
            key={t}
            className={`filter-btn${typeFilter === t ? ' filter-btn--active' : ''}`}
            onClick={() => setTypeFilter(t)}
          >
            {t === 'all' ? 'ALL' : t === 'structure' ? 'STR' : t.slice(0, 3).toUpperCase()}
          </button>
        ))}
        <span className="filter-sep">|</span>
        {(['all', 'common', 'uncommon', 'rare', 'legendary'] as const).map(r => (
          <button
            key={r}
            className={`filter-btn${rarityFilter === r ? ' filter-btn--active' : ''}`}
            onClick={() => setRarityFilter(r)}
          >
            {r === 'all' ? 'ALL' : r.slice(0, 3).toUpperCase()}
          </button>
        ))}
        <span className="filter-sep">|</span>
        <button
          className={`filter-btn${specialFilter === 'upgradeable' ? ' filter-btn--active' : ''}`}
          onClick={toggleSpecial}
          title="Show only cards with extra copies that can be mastered"
          style={specialFilter === 'upgradeable' ? { borderColor: '#ffd700', color: '#ffd700' } : {}}
        >
          ★ UPG
        </button>
        <span className="filter-owned">{totalOwned} cards</span>
      </div>

      {/* Grid */}
      <div className="collection-grid">
        {filtered.map(card => {
          const owned  = getOwnedCount(collection, card.name)
          const extras = Math.max(0, owned - COPIES_MAX)
          const xp     = getMasteryXp(collection, card.name)
          const { level: lvl } = masteryProgress(xp)
          const disenchantVal  = DISENCHANT_VALUE[card.rarity] * extras

          return (
            <div key={card.name} className={`collection-cell${owned === 0 ? ' collection-cell--unowned' : ''}`}>
              <CardTile card={card} canAfford={true} onClick={() => setDetailCard(card)} />

              <div className="cell-footer">
                <span className="cell-count">
                  ×{owned}{lvl > 0 && <span className="cell-mastery-badge">★{lvl}</span>}
                </span>
                {extras > 0 && (
                  <>
                    <button
                      className="extra-btn extra-btn--disenchant"
                      onClick={() => handleDisenchantCard(card.name)}
                      title={`+${disenchantVal} 💎`}
                    >
                      🔮+{disenchantVal}
                    </button>
                    <button
                      className="extra-btn extra-btn--master"
                      onClick={() => handleMasterCard(card.name)}
                      title={`+${extras} mastery XP`}
                    >
                      ★+{extras}
                    </button>
                  </>
                )}
              </div>

              {xp > 0 && <MasteryBar xp={xp} />}
            </div>
          )
        })}
      </div>

      {detailCard && (
        <CardDetailModal
          card={detailCard}
          collection={collection}
          onClose={() => setDetailCard(null)}
        />
      )}
    </div>
  )
}
