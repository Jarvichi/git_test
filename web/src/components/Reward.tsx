import React from 'react'
import { GameState } from '../game/types'
import { CardTile } from './CardTile'
import { hpBar } from '../game/engine'

interface Props {
  state: GameState
  onCollect: () => void
}

const CHEST_ART = `  _______
 /       \\
|  ?   ?  |
|_________|
|         |
|_________|`

export function Reward({ state, onCollect }: Props) {
  const topCard = state.drawPile.length > 0 ? state.drawPile[0] : null

  return (
    <div className="reward-screen">
      <div className="reward-title">═══ REWARD ═══</div>

      <pre className="chest-ascii">{CHEST_ART}</pre>

      <div className="reward-message">You found a treasure chest!</div>

      {topCard ? (
        <div className="reward-card-preview">
          <div>You will receive:</div>
          <div className="reward-card-sides">
            <div>
              <div className="side-label">Side A</div>
              <CardTile card={topCard} showSideA={true} />
            </div>
            <div>
              <div className="side-label">Side B</div>
              <CardTile card={topCard} showSideA={false} />
            </div>
          </div>
          <div className="reward-card-name">{topCard.name} ({topCard.rarity})</div>
        </div>
      ) : (
        <div className="reward-empty">(Draw pile empty — no card to gain)</div>
      )}

      <div className="player-stats">
        <div>{hpBar(state.playerHP, state.playerMaxHP, 'HP')}</div>
        <div>Draw:{state.drawPile.length} | Discard:{state.discardPile.length} | Hand:{state.hand.length}</div>
      </div>

      <button className="action-btn" onClick={onCollect}>
        [ Collect &amp; Continue &gt;&gt; ]
      </button>
    </div>
  )
}
