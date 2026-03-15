# Plan: Boss Card Mechanic (Phase 2 Fight)

**GitHub Issue #173**

Boss nodes have a phase 2: when the opponent's base falls, instead of winning, the player must destroy the boss unit that spawns. Only then does the game end.

---

## Flow

1. Battle plays normally until opponent base → 0 HP
2. Base restores to full HP; boss unit deploys to battlefield (opponent side)
3. Log: "⚡ PHASE 2! [Name] rises from the ruins! Destroy it to win!"
4. Player must kill the boss unit — only then does the game end

---

## Files to Change

| File | Change |
|---|---|
| `web/src/game/types.ts` | Add `bossCard?: string` and `bossCardActive?: boolean` to `GameState` |
| `web/src/game/questline.ts` | Add `bossCard?: string` to `QuestNode` |
| `web/src/game/engine.ts` | Extend `NewGameOptions`; rewrite `checkGameOver`; populate fields in `newGame`; handle sudden death guard |
| `web/src/App.tsx` | Pass `bossCard` through `resolvedNodeOpts` and two inline `newGame` call sites |
| `web/src/data/acts/act1.json` | Add `"bossCard": "Elder Treant"` to thornlord boss node |
| `web/src/data/acts/act2.json` | Add `"bossCard": "Golem"` to kragg boss node |
| `web/src/data/acts/act3.json` | Add `"bossCard": "Behemoth"` to ashwalker boss node |
| `web/src/data/acts/act4.json` | Add `"bossCard": "Giant"` to archivist boss node |

---

## Step 1 — `types.ts` + `questline.ts`: Add new fields

In `types.ts`, add after `bossAI?: string` in `GameState`:

```ts
bossCard?: string          // card name of the phase-2 boss unit
bossCardActive?: boolean   // true once the phase-2 unit has been deployed
```

In `questline.ts`, add after `bossAI?: string` in `QuestNode`:

```ts
bossCard?: string   // card name to deploy when opponent base falls (phase 2)
```

Commit: `feat: add bossCard fields to GameState and QuestNode types`

---

## Step 2 — `engine.ts`: Core mechanic

### 2a — Extend `NewGameOptions`

Add `bossCard?: string` alongside `bossAI`:

```ts
bossAI?: string
bossCard?: string
```

### 2b — Populate in `newGame` return value

Destructure and include in the return object:

```ts
const { ..., bossAI: boss, bossCard, ... } = opts

// In return:
bossAI: boss,
bossCard,
bossCardActive: false,
```

### 2c — Rewrite `checkGameOver`

Replace the existing `checkGameOver` function with:

```ts
function checkGameOver(s: GameState): boolean {
  // Phase 2 active — win condition is boss unit dead, not base HP
  if (s.bossCardActive && s.bossCard) {
    const bossAlive = s.field.some(u => u.owner === 'opponent' && u.name === s.bossCard)
    if (!bossAlive) {
      s.playerScore += VICTORY_BONUS
      s.phase = { type: 'gameOver', winner: 'player' }
      return true
    }
    if (s.playerBase.hp <= 0) {
      s.opponentScore += VICTORY_BONUS
      s.phase = { type: 'gameOver', winner: 'opponent' }
      return true
    }
    return false
  }

  // Normal checks
  if (s.playerBase.hp <= 0) {
    s.opponentScore += VICTORY_BONUS
    s.phase = { type: 'gameOver', winner: 'opponent' }
    return true
  }
  if (s.opponentBase.hp <= 0) {
    if (s.bossCard && !s.bossCardActive) {
      // Trigger phase 2
      s.opponentBase.hp = s.opponentBase.maxHp
      const template = CARD_DEFS.find(d => d.name === s.bossCard)?.unit
      if (template) {
        const bossUnit = spawnUnit(template, 'opponent')
        s.field.push(bossUnit)
        s.log.push(`⚡ PHASE 2! ${s.bossCard} rises from the ruins!`)
        s.log.push(`Destroy the ${s.bossCard} to win!`)
      }
      s.bossCardActive = true
      return false
    }
    s.playerScore += VICTORY_BONUS
    s.phase = { type: 'gameOver', winner: 'player' }
    return true
  }
  return false
}
```

**Note:** `CARD_DEFS` and `spawnUnit` are already in scope within `engine.ts`. No new imports needed.

### 2d — Sudden death guard

In the sudden death block, wrap the existing logic so it doesn't fire during phase 2:

```ts
if (!s.bossCardActive) {
  // existing sudden death logic here
}
```

Search for `suddenDeath` or `suddenDeathTimer` to find the exact block.

Commit: `feat: implement boss phase 2 mechanic in engine`

---

## Step 3 — `App.tsx`: Pass `bossCard` through

### 3a — `resolvedNodeOpts` helper

Add `bossCard: node.bossCard` to the returned object alongside `bossAI`:

```ts
bossAI: node.bossAI,
bossCard: node.bossCard,
```

### 3b — Inline `newGame` calls

Search for `bossAI: node.bossAI` — there are two inline `newGame` call sites (in `handleSelectNode` and `handleBossDialogueDone`). Add `bossCard: node.bossCard` alongside both.

Commit: `feat: pass bossCard through App.tsx newGame call sites`

---

## Step 4 — Act JSON: Wire boss nodes

Search each act file for `"type": "boss"` and add `"bossCard"`:

- `act1.json` thornlord node: `"bossCard": "Elder Treant"`
- `act2.json` kragg node: `"bossCard": "Golem"`
- `act3.json` ashwalker node: `"bossCard": "Behemoth"`
- `act4.json` archivist node: `"bossCard": "Giant"`

Commit: `feat: wire phase-2 boss cards into act 1–4 boss nodes`

---

## Boss Card Choices

| Act | Boss | Phase-2 Unit | Why |
|---|---|---|---|
| Act 1 | Thornlord | Elder Treant | Forest theme; high HP melee |
| Act 2 | Warlord Kragg | Golem | Iron/military theme; tanky |
| Act 3 | The Ashwalker | Behemoth | Highest ATK in game; terrifying |
| Act 4 | The Archivist | Giant | Arcane/ancient feel; strong melee |

---

## Implementation Notes

- **`spawnUnit(template, 'opponent')`** places the unit at the opponent spawn X with a random lane Y — same as normal deployment.
- **Boss unit name check** (`u.name === s.bossCard`) is safe because `spawnUnit` sets `unit.name = template.name`, which matches the card name exactly.
- **Save/restore safety:** `bossCardActive` is part of `GameState` which is persisted via `saveBattleState`. Phase 2 survives page refresh.
- **Sudden death** must be suppressed when `bossCardActive` is true — otherwise sudden death can override the boss-kill win condition.
- **Build check:** Run `npm run build` from `web/` after each step.
- **Manual test:** Play a boss battle (Act 1 Thornlord). Destroy the opponent base. Verify phase 2 triggers (log message + boss unit on field + base restored). Kill boss unit. Verify win flow proceeds normally (campaign summary → reward).
