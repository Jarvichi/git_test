import React from 'react'
import { GameState } from '../game/types'
import { CardTile } from './CardTile'
import { hpBar } from '../game/engine'

interface Props {
  state: GameState
  onPick: (cardId: string) => void
  onSkip: () => void
}

const VICTORY_ART = `  ╔═══════╗
  ║ ★ ★ ★ ║
  ║VICTORY!║
  ║ ★ ★ ★ ║
  ╚═══════╝`

export function BattleReward({ state, onPick, onSkip }: Props) {
  const choices = state.rewardChoices

  return (
    <div className="reward-screen">
      <div className="reward-title">═══ BATTLE REWARD ═══</div>

      <pre className="chest-ascii">{VICTORY_ART}</pre>

      <div className="reward-message">
        Choose 1 of {choices.length} cards to add to your hand:
      </div>

      <div className="reward-choices">
        {choices.map(card => (
          <div key={card.id} className="reward-choice" onClick={() => onPick(card.id)}>
            <div className="reward-card-sides">
              <div>
                <div className="side-label">Side A</div>
                <CardTile card={card} showSideA={true} />
              </div>
              <div>
                <div className="side-label">Side B</div>
                <CardTile card={card} showSideA={false} />
              </div>
            </div>
            <div className="reward-card-name">{card.name} ({card.rarity})</div>
            <button className="action-btn reward-pick-btn">[ Pick this card ]</button>
          </div>
        ))}
      </div>

      <div className="player-stats">
        <div>{hpBar(state.playerHP, state.playerMaxHP, 'HP')}</div>
        <div>Draw:{state.drawPile.length} | Discard:{state.discardPile.length} | Hand:{state.hand.length}</div>
      </div>

      <button className="action-btn" onClick={onSkip}>
        [ Skip Reward &gt;&gt; ]
      </button>
    </div>
  )
}
