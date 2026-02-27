import React from 'react'
import { Card } from '../game/types'
import { rarityStars } from '../game/cards'

interface Props {
  card: Card
  canAfford?: boolean
  onClick?: () => void
}

export function CardTile({ card, canAfford = true, onClick }: Props) {
  const stars = rarityStars(card.rarity).padEnd(4)
  const costStr = `[${card.cost}]`.padEnd(7)

  let line1: string
  let line2: string
  let line3: string

  if (card.cardType === 'upgrade' && card.upgradeEffect) {
    const e = card.upgradeEffect
    line1 = 'UPGRADE'
    line2 = e.type === 'buffAttack' ? `+${e.amount} ATK`.padEnd(7) : `HEAL ${e.amount}`.padEnd(7)
    line3 = 'ALL    '
  } else if (card.unit) {
    const u = card.unit
    line1 = u.name.slice(0, 7).padEnd(7)
    if (u.isWall || u.attack === 0) {
      line2 = `HP:${String(u.maxHp).padStart(2)}  `.slice(0, 7)
    } else {
      line2 = `A:${u.attack} H:${u.maxHp}`.padEnd(7).slice(0, 7)
    }
    if (u.isWall) {
      line3 = 'WALL   '
    } else if (u.bypassWall) {
      line3 = 'RANGE  '
    } else if (u.structureEffect?.type === 'mana') {
      line3 = `+${u.structureEffect.amount}MANA `.padEnd(7).slice(0, 7)
    } else if (u.structureEffect?.type === 'spawn') {
      const secs = Math.round(u.structureEffect.intervalMs / 1000)
      line3 = `/${secs}s     `.slice(0, 7)
    } else {
      line3 = '       '
    }
  } else {
    line1 = '       '
    line2 = '       '
    line3 = '       '
  }

  return (
    <div
      className={[
        'card-tile',
        `card-tile--${card.rarity}`,
        canAfford ? '' : 'card-tile--unaffordable',
      ].filter(Boolean).join(' ')}
      onClick={canAfford ? onClick : undefined}
      title={card.description}
    >
      <pre className="card-ascii">{`┌───────┐
│${costStr}│
│${line1}│
│${line2}│
│${line3}│
│${stars}   │
└───────┘`}</pre>
      <div className="card-name">{card.name}</div>
    </div>
  )
}
