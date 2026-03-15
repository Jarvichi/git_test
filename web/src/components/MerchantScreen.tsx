import React, { useState } from 'react'
import { Card } from '../game/types'
import { UselessItem } from '../game/dailyLogin'
import { MERCHANT_PRICES } from '../game/questline'
import { CardTile } from './CardTile'

export type MerchantItem =
  | { kind: 'card'; card: Card; price: number }
  | { kind: 'item'; inventoryItem: UselessItem; price: number }

/** Legacy helper: build a card MerchantItem */
export function cardMerchantItem(card: Card): MerchantItem {
  return { kind: 'card', card, price: MERCHANT_PRICES[card.rarity] }
}

function itemKey(item: MerchantItem): string {
  return item.kind === 'card' ? item.card.name : item.inventoryItem.id
}

interface Props {
  items: MerchantItem[]
  crystals: number
  onBuy: (item: MerchantItem) => void
  onDone: () => void
}

export function MerchantScreen({ items, crystals, onBuy, onDone }: Props) {
  const [balance, setBalance]     = useState(crystals)
  const [purchased, setPurchased] = useState<Set<string>>(new Set())

  function handleBuy(item: MerchantItem) {
    const key = itemKey(item)
    if (purchased.has(key)) return
    if (balance < item.price) return
    setBalance(b => b - item.price)
    setPurchased(p => new Set([...p, key]))
    onBuy(item)
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
          const key    = itemKey(item)
          const bought = purchased.has(key)
          const canBuy = !bought && balance >= item.price

          if (item.kind === 'item') {
            const inv = item.inventoryItem
            return (
              <div
                key={key}
                className={`merchant-item merchant-item--rare merchant-item--inv${bought ? ' merchant-item--bought' : ''}`}
              >
                <div className="merchant-inv-tile">
                  <div className="merchant-inv-icon">{inv.icon}</div>
                  <div className="merchant-inv-name">{inv.name}</div>
                  <div className="merchant-inv-desc">{inv.desc}</div>
                </div>
                <div className="merchant-item-footer">
                  {bought ? (
                    <span className="merchant-purchased">✓ PURCHASED</span>
                  ) : (
                    <button
                      className={`action-btn merchant-buy-btn${canBuy ? '' : ' merchant-buy-btn--poor'}`}
                      onClick={() => handleBuy(item)}
                      disabled={!canBuy}
                    >
                      ◆ {item.price}
                    </button>
                  )}
                </div>
              </div>
            )
          }

          const rarity = item.card.rarity
          return (
            <div
              key={key}
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
                    ◆ {item.price}
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
