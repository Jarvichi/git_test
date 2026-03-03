import React from 'react'
import { Card } from '../game/types'
import { rarityStars } from '../game/cards'
import { SpriteImg } from './SpriteImg'

interface Props {
  card: Card
  canAfford?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function CardTile({ card, canAfford = true, disabled = false, onClick }: Props) {
  const clickable = canAfford && !disabled

  let stats: string
  let tag: string | null = null

  if (card.isHero) {
    tag = '★ HERO'
  }

  if (card.cardType === 'upgrade' && card.upgradeEffect) {
    const e = card.upgradeEffect
    stats = e.type === 'buffAttack' ? `+${e.amount} ATK` : `HEAL ${e.amount}`
    if (!card.isHero) tag = 'UPGRADE'
  } else if (card.unit) {
    const u = card.unit
    if (u.isWall || u.attack === 0) {
      stats = `HP ${u.maxHp}`
    } else {
      stats = `${u.attack} ATK / ${u.maxHp} HP`
    }
    if (u.isWall) tag = 'WALL'
    else if (u.bypassWall) tag = 'RANGED'
    else if (u.structureEffect?.type === 'spawn') {
      const secs = Math.round(u.structureEffect.intervalMs / 1000)
      tag = `SPAWN /${secs}s`
    } else if (u.structureEffect?.type === 'mana') {
      tag = `+${u.structureEffect.amount} MANA`
    }
  } else {
    stats = ''
  }

  return (
    <div
      className={[
        'card-tile',
        `card-tile--${card.rarity}`,
        clickable ? '' : 'card-tile--disabled',
      ].filter(Boolean).join(' ')}
      onClick={clickable ? onClick : undefined}
      title={card.description}
    >
      <div className="card-cost">{card.cost}</div>
      <div className="card-title">{card.name}</div>
      {card.unit && (
        <div className="card-art">
          <SpriteImg name={card.unit.name} className="card-sprite" />
        </div>
      )}
      <div className="card-stats">{stats}</div>
      {tag && <div className="card-tag">{tag}</div>}
      <div className="card-rarity">{rarityStars(card.rarity)}</div>
    </div>
  )
}
