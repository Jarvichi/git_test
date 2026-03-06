import React, { useState } from 'react'
import { Card } from '../game/types'
import { MERCHANT_PRICES } from '../game/questline'
import { CardTile } from './CardTile'

export interface MerchantItem {
  card: Card
  price: number
}

interface Props {
  items: MerchantItem[]
  crystals: number
  onBuy: (cardName: string, price: number) => void
  onDone: () => void
}

export function MerchantScreen({ items, crystals, onBuy, onDone }: Props) {
  const [balance, setBalance]     = useState(crystals)
  const [purchased, setPurchased] = useState<Set<string>>(new Set())

  function handleBuy(item: MerchantItem) {
    if (purchased.has(item.card.name)) return
    if (balance < item.price) return
    setBalance(b => b - item.price)
    setPurchased(p => new Set([...p, item.card.name]))
    onBuy(item.card.name, item.price)
  }

  return (
    <div className="merchant-screen">
      <div className="merchant-header">
        <span className="merchant-title">// TRAVELLING MERCHANT</span>
        <span className="merchant-crystals">◆ {balance} crystals</span>
      </div>

      <div className="merchant-tagline">
        "Everything has a price. Today, at least these have <em>reasonable</em> ones."
      </div>

      {balance === 0 && (
        <div className="merchant-broke-hint">
          No crystals? Earn them by winning battles in <strong>Quick Play</strong> or <strong>Campaign</strong> — every victory pays out.
        </div>
      )}

      <div className="merchant-items">
        {items.map(item => {
          const bought  = purchased.has(item.card.name)
          const canBuy  = !bought && balance >= item.price
          const rarity  = item.card.rarity
          const price   = MERCHANT_PRICES[rarity]
          return (
            <div
              key={item.card.name}
              className={`merchant-item merchant-item--${rarity}${bought ? ' merchant-item--bought' : ''}`}
            >
              <CardTile card={item.card} canAfford={canBuy} onClick={canBuy ? () => handleBuy(item) : undefined} />
              <div className="merchant-item-footer">
                {bought ? (
                  <span className="merchant-purchased">✓ PURCHASED</span>
                ) : (
                  <button
                    className={`action-btn merchant-buy-btn${canBuy ? '' : ' merchant-buy-btn--poor'}`}
                    onClick={() => handleBuy(item)}
                    disabled={!canBuy}
                  >
                    ◆ {price}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button className="action-btn action-btn--large merchant-leave" onClick={onDone}>
        LEAVE ›
      </button>
    </div>
  )
}
