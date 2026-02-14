import React from 'react'
import { Card, GameState } from '../game/types'
import { CardTile } from './CardTile'
import { hpBar } from '../game/engine'

interface Props {
  state: GameState
  onPlayCombatCard: (card: Card) => void
  isBoss?: boolean
}

const ENEMY_ART: Record<string, string> = {
  Goblin: `  ,--,
 (o  o)
  >--<
 /|  |\\`,
  Bandit: `  [==]
 (B  B)
  >--<
 /|  |\\`,
  Troll: ` .----.
(O    O)
 >----<
/||  ||\\`,
  'DRAGON LORD': `    /\\_/\\
   ( o.o )
    > ^ <
   /|   |\\
  (_|   |_)
 DRAGON LORD`,
}

export function Battle({ state, onPlayCombatCard, isBoss }: Props) {
  const battle = state.activeBattle
  if (!battle) return null

  const title = isBoss ? '!!! BOSS FIGHT !!!' : '═══ BATTLE ═══'
  const enemyArt = ENEMY_ART[battle.enemyName] || `  (?_?)\n  /| |\\`

  return (
    <div className={`battle-screen ${isBoss ? 'battle-screen--boss' : ''}`}>
      <div className="battle-title">{title}</div>

      <pre className="enemy-ascii">{enemyArt}</pre>

      <div className="enemy-hp">{hpBar(battle.enemyHP, battle.enemyMaxHP, battle.enemyName)}</div>
      <div className="battle-info">
        ATK: {battle.enemyDamagePerTurn}/turn | Your Block: {battle.playerBlockThisTurn}
      </div>

      <div className="combat-log">
        {battle.log.slice(-6).map((entry, i) => (
          <div key={i} className="log-entry">&gt; {entry}</div>
        ))}
      </div>

      <div className="player-stats">
        <div>{hpBar(state.playerHP, state.playerMaxHP, 'HP')}</div>
        <div>Draw:{state.drawPile.length} | Discard:{state.discardPile.length} | Hand:{state.hand.length}</div>
      </div>

      <div className="combat-label">── PLAY A CARD (Side B: Combat) ──</div>

      <div className="hand-cards">
        {state.hand.map(card => (
          <CardTile
            key={card.id}
            card={card}
            showSideA={false}
            onClick={() => onPlayCombatCard(card)}
          />
        ))}
      </div>

      {state.hand.length === 0 && (
        <div className="no-cards-warning">NO CARDS LEFT!</div>
      )}
    </div>
  )
}
