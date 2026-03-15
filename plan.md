# Plan: Relic Selection Screen + Break Chance (#174)

## What's needed

1. **Explicit relic selection** at act start (currently auto-equips last earned) — RelicSelectScreen already exists, just needs to be shown at the right time
2. **50% break chance** on act completion — equipped relic has a coin-flip chance of breaking
3. **Broken relics** are greyed out on the selection screen; can't be equipped
4. **Re-earn** to un-break: completing the act that originally awarded a relic un-breaks it

---

## Storage

Add a new localStorage key `jarv_broken_relics` — a JSON array of broken relic names.

Add these helpers to `web/src/game/relics.ts`:

```ts
const BROKEN_KEY = 'jarv_broken_relics'

export function loadBrokenRelics(): string[] {
  try { return JSON.parse(localStorage.getItem(BROKEN_KEY) ?? '[]') } catch { return [] }
}

function saveBrokenRelics(names: string[]): void {
  localStorage.setItem(BROKEN_KEY, JSON.stringify(names))
}

export function breakRelic(name: string): void {
  const broken = loadBrokenRelics()
  if (!broken.includes(name)) saveBrokenRelics([...broken, name])
}

export function unbreakRelic(name: string): void {
  saveBrokenRelics(loadBrokenRelics().filter(n => n !== name))
}
```

Commit: `feat: add broken relic persistence helpers to relics.ts`

---

## Step 1 — `relics.ts`: Add persistence helpers

Add the four functions above (`loadBrokenRelics`, `saveBrokenRelics`, `breakRelic`, `unbreakRelic`) to `relics.ts` and export the public ones.

Commit: `feat: add broken relic persistence helpers to relics.ts`

---

## Step 2 — `RelicSelectScreen.tsx`: Show broken relics greyed out

Add a `brokenRelics: string[]` prop. Broken relics render at reduced opacity with a ~~strikethrough~~ label ("BROKEN") and are not selectable.

```tsx
interface Props {
  earnedRelics: string[]
  brokenRelics: string[]    // NEW
  currentRelic: string | null
  onSelect: (relicName: string | null) => void
}
```

In the grid, for each relic:

```tsx
const isBroken = brokenRelics.includes(relic.name)
<div
  key={relic.name}
  className={`relic-option ${selected === relic.name ? 'selected' : ''} ${isBroken ? 'relic-option--broken' : ''}`}
  onClick={() => { if (!isBroken) setSelected(relic.name) }}
>
  <span>{relic.icon}</span>
  <span>{relic.name}</span>
  {isBroken && <span className="relic-broken-label">BROKEN</span>}
  {!isBroken && <span>{relic.desc}</span>}
</div>
```

Also ensure the confirm button is disabled if `selected` is a broken relic (edge case guard).

Add CSS to `styles.css`:

```css
.relic-option--broken {
  opacity: 0.35;
  cursor: not-allowed;
  border-color: #2a2a2a;
}

.relic-broken-label {
  font-size: 9px;
  letter-spacing: 1px;
  color: #884444;
}
```

Commit: `feat: show broken relics greyed out in RelicSelectScreen`

---

## Step 3 — `App.tsx`: Wire break chance and re-earn

### 3a — Import new helpers

Add `breakRelic`, `unbreakRelic`, `loadBrokenRelics` to the import from `relics`.

### 3b — Pass `brokenRelics` to `RelicSelectScreen`

Find where `<RelicSelectScreen>` is rendered (search for `screen === 'relicselect'`). Add:

```tsx
<RelicSelectScreen
  earnedRelics={loadEarnedRelics()}
  brokenRelics={loadBrokenRelics()}    // ADD
  currentRelic={run?.activeRelic ?? null}
  onSelect={relicSelectDoneRef.current}
/>
```

### 3c — Apply 50% break chance in `handleActComplete`

In `handleActComplete`, the current flow is:

```ts
// earn relic
if (act?.rewardRelic) addEarnedRelic(act.rewardRelic)

// ... proceed to relic select screen or next act
```

After earning the relic but **before** transitioning, check if the player's equipped relic breaks:

```ts
// 50% chance: equipped relic breaks on act completion
const equippedRelic = currentRun.activeRelic
if (equippedRelic && Math.random() < 0.5) {
  breakRelic(equippedRelic)
  // Add a broken relic item to inventory
  const relicDef = getRelicDef(equippedRelic)
  if (relicDef) {
    addToInventory({
      id: `broken-relic-${equippedRelic.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: `Cracked ${equippedRelic}`,
      icon: relicDef.icon,
      desc: `A cracked ${equippedRelic} — it held until it didn't.`,
      acquiredDate: new Date().toISOString(),
    })
  }
}
```

Place this block **after** the `addEarnedRelic` call and **before** the relic select / next act logic.

### 3d — Re-earn: un-break when replaying an act that drops the same relic

In the same `handleActComplete`, right after `addEarnedRelic(act.rewardRelic)`:

```ts
if (act?.rewardRelic) {
  addEarnedRelic(act.rewardRelic)
  unbreakRelic(act.rewardRelic)   // un-break if previously broken
}
```

This means replaying Act 1 always un-breaks Bark Shield, regardless of whether it was broken.

Commit: `feat: add relic break chance and re-earn logic to handleActComplete`

---

## Files to Change

| File | Change |
|---|---|
| `web/src/game/relics.ts` | Add `loadBrokenRelics`, `breakRelic`, `unbreakRelic` exports |
| `web/src/components/RelicSelectScreen.tsx` | Add `brokenRelics` prop; grey out broken relics |
| `web/src/styles.css` | Add `.relic-option--broken` and `.relic-broken-label` styles |
| `web/src/App.tsx` | Pass `brokenRelics` to screen; apply break chance + re-earn in `handleActComplete` |

---

## Implementation Notes

- **Read `RelicSelectScreen.tsx` in full** before editing to understand its existing state management
- **Read the `handleActComplete` function** in full before editing — it has both a "next act" path and a "final act" path; the break chance should apply on both
- **`addToInventory` import** — check what file exports it (`dailyLogin.ts`) and add to App.tsx imports if not already there
- **Build check** after each step
- **Manual test:** Complete Act 1 boss → see relic select screen → equip Bark Shield → complete Act 2 → 50% chance Bark Shield is now greyed out on next select screen
- **No test framework** — smoke test only
