# Plan: Battle Summary Screen

**Phase 7 QoL — CLAUDE.md:** "Battle summary screen: stats popup after each battle — cards played, kills by unit, damage dealt, turns taken"

After completing a campaign battle, show a terminal-styled stats panel before the card reward screen. Displays cards played, enemy units killed, friendly units lost, damage dealt, and battle duration.

---

## Scope

- **Campaign battles only** (quick play already has the GameOver screen with score; campaign has no equivalent stats view)
- Show after win only (losses already go to the campaign-retry flow)
- One new component, small changes to 4 existing files

---

## Files to Change

| File | Change |
|---|---|
| `web/src/game/types.ts` | Add `BattleStats` interface; add `battleStats` field to `GameState` |
| `web/src/game/engine.ts` | Init `battleStats` in `newGame`; count kills/losses at the two unit-removal sites |
| `web/src/App.tsx` | Track cards played per battle; add `'battlesummary'` screen; wire campaign win through summary |
| `web/src/components/BattleSummary.tsx` | **New file** — the summary component |
| `web/src/styles.css` | Add styles for the new component |

---

## Step 1 — `types.ts`: Add `BattleStats`

Add the interface and field. Commit immediately after.

```ts
// Add new interface before GameState:
export interface BattleStats {
  cardsPlayed: Record<string, number>  // card name → times played this battle
  playerKills: number                   // opponent mobile units destroyed
  playerUnitsLost: number              // player mobile units destroyed
}

// In GameState (after the existing `relicManaBonus?` line):
  battleStats: BattleStats
```

Commit: `feat: add BattleStats interface to GameState types`

---

## Step 2 — `engine.ts`: Init and track stats

### 2a — Init in `newGame` return object (line ~326, after `environment,`)

```ts
    battleStats: { cardsPlayed: {}, playerKills: 0, playerUnitsLost: 0 },
```

### 2b — Count kills at **both** unit-removal sites

There are two places in `engine.ts` where `s.field = s.field.filter(u => u.hp > 0)` is called:
- Around line **702** (inside `resolveCombat`, after soulstone revive check)
- Around line **980** (inside the opponent AI / Thornlord section — search for the second occurrence)

Before **each** of those two filter lines, insert:

```ts
for (const u of s.field) {
  if (u.hp <= 0 && u.moveSpeed > 0 && !u.isWall) {
    if (u.owner === 'opponent') s.battleStats.playerKills++
    else                        s.battleStats.playerUnitsLost++
  }
}
```

Commit: `feat: initialise and track battle stats in engine`

---

## Step 3 — `App.tsx`: Wire up the summary screen

### 3a — Add `'battlesummary'` to the `ScreenType` union

Around line 136, add `| 'battlesummary'` to the union.

### 3b — Add state and a ref

Near the other `useRef`/`useState` declarations:

```ts
const summaryDoneRef = useRef<() => void>(() => {})
const [summaryStats, setSummaryStats] = useState<{
  stats: import('./game/types').BattleStats
  gameTime: number
  playerScore: number
} | null>(null)
```

### 3c — Track cards played per battle in `handlePlayCard`

In `handlePlayCard` (line ~1073), after `const next = playCard(s, cardId)` and before `saveBattleState(next)`:

```ts
next.battleStats = {
  ...next.battleStats,
  cardsPlayed: {
    ...next.battleStats.cardsPlayed,
    [card.name]: (next.battleStats.cardsPlayed[card.name] ?? 0) + 1,
  },
}
```

### 3d — Campaign win: go through summary before reward

In `handleCampaignWin` (the function that runs after a campaign battle win, around line 824–834), the existing code is:

```ts
// Grant crystals for winning
const crystalReward = node.type === 'boss' ? 25 : node.type === 'elite' ? 15 : 10
const newCrystals = loadCrystals() + crystalReward
saveCrystals(newCrystals)
setCrystals(newCrystals)

// Show card reward
const choices = generateRewardChoices(node.type, act.rewardTags)
setRewardChoices(choices)
setRewardCrystals(crystalReward)
setScreen('reward')
```

Replace with:

```ts
// Grant crystals for winning
const crystalReward = node.type === 'boss' ? 25 : node.type === 'elite' ? 15 : 10
const newCrystals = loadCrystals() + crystalReward
saveCrystals(newCrystals)
setCrystals(newCrystals)

// Capture stats snapshot then show summary; summary → reward
setSummaryStats({
  stats: gameState.battleStats,
  gameTime: gameState.gameTime,
  playerScore: gameState.playerScore,
})
summaryDoneRef.current = () => {
  const choices = generateRewardChoices(node.type, act.rewardTags)
  setRewardChoices(choices)
  setRewardCrystals(crystalReward)
  setScreen('reward')
}
setScreen('battlesummary')
```

Note: `handleCampaignWin` is a `useCallback`. `gameState` is in scope via the closure — verify it is, or pass it as a parameter. If not in scope, capture it from the ref: `gameState` is stored in state so it's accessible. Double-check during implementation.

The act-complete path (boss win that ends the act) should **not** go through summary — that path returns early before the crystal/reward block. Verify the `if (isActComplete(...)) { ... return }` is still before this block.

### 3e — Render the new screen

In the screen routing section (where `screen === 'reward'`, `screen === 'relicselect'`, etc. are rendered), add:

```tsx
{screen === 'battlesummary' && summaryStats && (
  <BattleSummary
    stats={summaryStats.stats}
    gameTime={summaryStats.gameTime}
    playerScore={summaryStats.playerScore}
    onContinue={() => summaryDoneRef.current()}
  />
)}
```

Import `BattleSummary` at the top with the other component imports.

Commit: `feat: add battle summary screen to campaign win flow`

---

## Step 4 — `BattleSummary.tsx`: New component

Create `web/src/components/BattleSummary.tsx`:

```tsx
import React from 'react'
import { BattleStats } from '../game/types'

interface Props {
  stats: BattleStats
  gameTime: number       // ms elapsed
  playerScore: number    // cumulative damage dealt to opponent base
  onContinue: () => void
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

export function BattleSummary({ stats, gameTime, playerScore, onContinue }: Props) {
  // Sort cards played: descending by count, take top 5
  const topCards = Object.entries(stats.cardsPlayed)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const totalCards = Object.values(stats.cardsPlayed).reduce((a, b) => a + b, 0)

  return (
    <div className="bsummary-backdrop">
      <div className="bsummary-panel">
        <div className="bsummary-title">— BATTLE COMPLETE —</div>

        <div className="bsummary-stats">
          <div className="bsummary-row">
            <span className="bsummary-label">UNITS DEFEATED</span>
            <span className="bsummary-value">{stats.playerKills}</span>
          </div>
          <div className="bsummary-row">
            <span className="bsummary-label">UNITS LOST</span>
            <span className="bsummary-value">{stats.playerUnitsLost}</span>
          </div>
          <div className="bsummary-row">
            <span className="bsummary-label">DAMAGE DEALT</span>
            <span className="bsummary-value">{playerScore}</span>
          </div>
          <div className="bsummary-row">
            <span className="bsummary-label">DURATION</span>
            <span className="bsummary-value">{formatDuration(gameTime)}</span>
          </div>
          <div className="bsummary-row">
            <span className="bsummary-label">CARDS PLAYED</span>
            <span className="bsummary-value">{totalCards}</span>
          </div>
        </div>

        {topCards.length > 0 && (
          <div className="bsummary-cards">
            <div className="bsummary-cards-label">TOP CARDS</div>
            {topCards.map(([name, count]) => (
              <div key={name} className="bsummary-card-row">
                <span className="bsummary-card-name">{name}</span>
                <span className="bsummary-card-count">×{count}</span>
              </div>
            ))}
          </div>
        )}

        <button className="action-btn action-btn--large bsummary-continue" onClick={onContinue}>
          CLAIM REWARD →
        </button>
      </div>
    </div>
  )
}
```

Commit: `feat: add BattleSummary component`

---

## Step 5 — `styles.css`: Add styles

Append to `styles.css`. Target: retro terminal aesthetic matching the rest of the game.

```css
/* ── Battle Summary Screen ─────────────────────────────── */

.bsummary-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.bsummary-panel {
  background: #0a0a0a;
  border: 1px solid #2a4a2a;
  max-width: 320px;
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 0 32px rgba(51, 255, 51, 0.1);
}

.bsummary-title {
  font-size: 11px;
  letter-spacing: 2px;
  color: #4a8a4a;
  text-align: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #1e2e1e;
}

.bsummary-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bsummary-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.bsummary-label {
  font-size: 10px;
  letter-spacing: 1px;
  color: #4a8a4a;
}

.bsummary-value {
  font-size: 14px;
  color: #33ff33;
  font-weight: bold;
}

.bsummary-cards {
  border-top: 1px solid #1e2e1e;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bsummary-cards-label {
  font-size: 9px;
  letter-spacing: 1.5px;
  color: #4a8a4a;
  margin-bottom: 4px;
}

.bsummary-card-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.bsummary-card-name {
  font-size: 11px;
  color: #88cc88;
}

.bsummary-card-count {
  font-size: 11px;
  color: #33ff33;
}

.bsummary-continue {
  margin-top: 4px;
}
```

Commit: `feat: add battle summary screen styles`

---

## Implementation Notes for Next Session

- **Start by reading this plan and the 5 files listed above** before making any changes
- **Engine kill tracking**: Search engine.ts for `s.field = s.field.filter(u => u.hp > 0)` — there should be exactly 2 occurrences. Add the kill-counting loop before each one.
- **App.tsx scope check**: In `handleCampaignWin`, confirm `gameState` is accessible. It is a piece of React state set via `setGameState`, and `handleCampaignWin` is a `useCallback` — check its dependency array. If `gameState` isn't in the deps, access it via `gameStateRef.current` if one exists, or add it to deps. Look for how other callbacks access `gameState` in the file.
- **Act-complete guard**: The `if (isActComplete(...)) { ... return }` block fires before the crystal/reward block. The summary should only appear in the crystal/reward block (non-act-completing wins). Boss wins that complete an act skip straight to cutscene → actcomplete, which is correct.
- **Build check**: Run `npm run build` from `web/` after each step to catch TypeScript errors early. Fix before committing.
- **No test framework** — manual smoke test: play a campaign battle, win, verify summary appears with non-zero stats, click "CLAIM REWARD" → lands on reward screen.
- **CLAUDE.md Phase 3 relics** are fully implemented — mark all 4 Phase 3 checkboxes `[x]` and commit `CLAUDE.md` in a separate commit before starting implementation work.
