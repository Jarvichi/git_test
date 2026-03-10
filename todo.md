# Jarv's Amazing Web Game — Todo List

Issues sourced from GitHub. Last synced: 2026-03-10.

---

## 🟠 Active Work

- [x] **#137** Caching: add service worker via vite-plugin-pwa to cache resources locally on user's device

---

## 🔴 Critical Bugs

- [x] **#97** Campaign: Act 2 event/shrine nodes launch a battle instead — fixed by user's "add events" commit (supply-cache/goblin-deal/wanderer/ambush-merchant added to events.json) — needs manual close on GitHub
- [x] **#53** Campaign soft-lock: `pendingNodeId` left set blocks map; blank screen at act end; validate/repair all localStorage on load
- [x] **#56** Campaign run-count text always says "fifth time" after run 5 — fix to use actual count
- [x] **Intro always says "tenth"** (no issue#) — runs 11–24 (and 26–49 etc.) still show milestone run text
- [x] **#90** Campaign events (shrine/ruins): result screen dismisses too fast — EventScreen already has CONTINUE button; already fixed — needs manual close on GitHub

---

## 🟠 Gameplay Bugs

- [x] **#110** Points: winner could end up with fewer points than loser — fixed: winner gets +500 victory bonus in `checkGameOver` — needs manual close on GitHub
- [x] **#99** Obstacle avoidance: units give obstacles way too much clearance — reduce buffer zone around obstacle hitboxes (pushDist: obs.radius+55 → obs.radius+22)
- [x] **#86** Rewards screen: crystal amount not displayed — already fixed in PostBattleReward component (`+{crystals} ◆`) — needs manual close on GitHub
- [x] **#80** Difficulty scaling: each subsequent run reduces node handicap by 2 and raises opponent HP by 10 (via resolvedNodeOpts helper in App.tsx)

 - [x] **#63** Unit movement: units don't avoid obstacles properly (hitbox mismatch with SVG size) (closed on GitHub)
 - [x] **#62** Gameplay balance: Farm upgrade mana bug; structure cost vs unit cost balance (closed on GitHub)
- [x] **#87** Inventory: item detail modal when tapping a card; relics appear in inventory with icon, name, desc
- [x] **#88** Event rewards: shrines and watchtowers should occasionally give inventory/relic items (not just HP/crystals/cards)

---

## 🟡 UX / UI Bugs

 - [x] **#58** Screen size: battlefield + hand don't fit on small phone screens — scale to viewport (closed on GitHub)
- [x] **#65** Collection screen: Upgrade/Sell buttons always visible (greyed when unavailable), add text labels
- [x] **#46** UI consistency: title screen buttons same size; collection cards same size; victory screen buttons same size
- [x] **#109** Battery drain: game drains phone battery quickly — pause game loop when tab hidden; prefers-reduced-motion CSS
- [x] **#112** Buff cards UX: players can't tell if buff applies to current units or full battle duration — show status icons above buffed units and/or a HUD indicator for duration buffs

---

## 🟢 Enhancements — High Value

- [x] **#51** Daily login rewards: wire DailyLoginModal + InventoryScreen into App.tsx (files exist, not integrated)
- [x] **#57** Campaign shrines: hide expected rewards; randomise options; one option can be negative
 - [x] **#59** Campaign QoL: hint after 2 failed attempts; crystals as battle reward; explain merchant when broke (closed on GitHub)
- [x] **#61** Battlefield: buildings spread across multiple rows from centre; upgrade level visual feedback
- [x] **#49** Deck builder: add sort / filter / search (already implemented — closing)
 - [x] **#48** Deck builder filter labels: now use full words (Units, Structs, Upgrades, Common, Uncommon, Rare, Legendary, + TYPE/RARITY/SORT group labels) (closed on GitHub)
- [x] **#73** Campaign hack: page refresh now auto-resumes into the active battle (no title screen shown) — needs manual close
- [x] **#50** Sound: better battle music; death cries; crash sound for buildings (already implemented — needs manual close)
- [x] **#60** Rare event — The Gambler: tap-to-guess modal; win all cards or game reset; rubber chicken consolation; history tracking — needs manual close

---

## 🔵 Enhancements — Medium

- [ ] **#64 / #115 / #116** Tutorials: deck builder tutorial (#115); gameplay tutorial (#116)
- [x] **#117** Lock campaign until 30 cards collected; show hint to play Quick Battle — done
- [x] **#47** Buff/upgrade cards need icons/images (already implemented in CardTile.tsx UpgradeIcon)
- [ ] **#66 / #118** Debugging: feedback/bug submission screen (#118); access submissions when planning todos (#118)
- [x] **#119** Export/import localStorage to file behind `?debug` URL param — added to Settings page
- [ ] **#60** Rare event — The Gambler: tap-to-guess modal, win all cards or lose everything; rubber chicken consolation; track rare event log
- [ ] **#52** More secrets scattered through the game
- [ ] **#55** Anti-hacking: checksum on card collection + inventory; warn on mismatch; safe first-load migration

---

## 🟣 Relic System (Phase 3 — partial)

- [x] **Relic storage** — `RunState.activeRelic` added; saved to `jarv_relics` on act complete; auto-equipped for next run; effects applied at battle start
- [x] Relic data in `web/src/game/relics.ts` (Bark Shield + Iron Standard defined)
- [x] Relic effects applied at campaign battle start in `App.tsx`
- [x] Relic display on Battlefield HUD
- [x] Relic selection screen between acts (currently auto-equips last earned)

---

## 🗺️ Campaign Acts

- [x] Act 2 — The Iron Citadel: act2.json node map, boss Warlord Kragg, Iron Standard relic
- [x] Act 3 — The Ashen Wastes: act3.json node map, boss The Ashwalker, Soulstone relic
- [x] Act 4 — The Crystal Spire: act4.json (4-wide, 9 rows), boss The Archivist (infinite mana at turn 8+), Prism Lens relic
- [x] Expand Acts 1–3 to be longer/wider (4 cols wide, more rows like act4)
- [ ] Act 5 — The Fractured Core (future)

---

## 🟣 Enhancements — Pending

- [ ] **#100** Unit behavioral traits: avoidance, fleeing, target priority (destroy walls, buildings, boss, protect base) — fall back to default if trait unfulfilled
- [x] **#102** Achievements system: per-unit/building kill milestones (1000/10000), witty names, rewards (cards/crystals/items), Gambler/rubber-chicken achievements, act-completion counts, dedicated achievements screen

## ⚪ Features — Large / Long-term

 - [x] **#54** Intro screen: "Awesome Software Presents" logo → Jarv SVG → title (skip setting in settings) (closed on GitHub)
- [ ] **#44** Battlefield z-order: water → rocks → walls → trees → surroundings; units above walls, under canopy; flyers above all
- [ ] **#45** Battlefield scenery themed to environment (rocks/water/ice/canyon)
- [x] **#43** Flying units cast a shadow (already implemented)
- [ ] **#61 / #113** Battlefield: projectile animations; damage/blood augments on sprites; death/climb animations; animation variety (climbing, taking damage, dying, killing) (#113)
- [ ] **#114** Opponent graphics: replace HP bars with a sprite for each player; unique enemy sprite per campaign level
- [ ] **#68** Dark / Light mode toggle in settings
- [ ] **#67** Cross-device persistent game state (design only for now)

---

## 🔵 Enhancements — Architecture

- [x] **#78** External config files: move card definitions, campaign acts, events, and merchant data out of TypeScript into JSON config files with a generic loader

---

## 🗺️ Acts System — From Issue #144 (see docs/acts.md)

Items below are unimplemented features identified in issue #144. Reference `docs/acts.md` for full specs.

### Campaign Map
- [ ] **#144** Mystery node: runtime replacement of a normal battle node; displayed as normal battle on map; on entry shows cleared battlefield + reward chest + lore text ("whoops, forgot to clean up")
- [ ] **#144** Node peek modal: tapping a node shows a preview modal with reward summary, difficulty hint, "Enter Battle" + "Back" buttons; on previously-completed nodes also shows opponent deck + playstyle

### Boss Mechanic
- [ ] **#144** Boss card mechanic: boss node opponent gets a boss card instead of hero; when opponent base hits 0 HP, base restores to full and boss unit deploys; player must kill the boss unit to win — add `bossCard` field to QuestNode, `bossCardActive` flag to GameState, intercept game-over in engine.ts

### Campaign Structure
- [ ] **#144** Extend campaign to 25 acts (currently 4); plan and write acts 5–25 story, node maps, bosses, relics, hero cards, themed card sets
- [ ] **#144** Second 25-act story arc: after act 25 completes, a new 25-act arc begins in the same world with a new plot

### Replay System
- [ ] **#144** Per-run modifiers: each replay of an act adds an escalating modifier (e.g. +X% enemy HP, faster opponent mana); configure modifier list in act JSON as `replayModifiers` array
- [ ] **#144** Boss dialogue run-awareness: support substitution tags (`{n}`, `{ordinalLower}`) inside `bossDialogue` strings (currently plain text only)
- [ ] **#144** Global word substitution config: a separate JSON file (`web/src/data/wordVariants.json`) holding single-word alternate arrays usable as `{word:key}` tags in any act text

### Relics
- [ ] **#144** Relic selection screen: at the start of each act, show all owned relics and let player pick 1 to equip (currently auto-equips last earned)
- [ ] **#144** Relic breaking: on act-completion screen, 50% chance relic breaks and becomes unusable; broken relics shown greyed out in inventory; re-earn by completing the act again

### Lives System
- [x] **#144** Add 3 lives to RunState (`livesRemaining`, `maxLives`); on battle loss player loses 1 life and can retry; at 0 lives show Campaign Failed screen (+50 crystals reward); lives reset to min 3 at act completion; relics/events can grant lives up to 9; shown in NodeMap HUD; "Nine Lives" achievement
- [x] **#144** Campaign Failed screen: 50 crystal reward, clear run, return to menu

### Cards
- [ ] **#144** Add `lore` field to card schema (cards.json + TypeScript types) for per-card flavour text
- [ ] **#144** Per-act themed card sets: at least 25 cards per act, tagged to that act's theme, earnable only in that act (except daily/crystal rewards)

### Music
- [x] **#144** Refactor sound.ts: export `MusicTrackConfig` type and `startMusicTrack`/`stopMusicTrack` generic API; named config objects (`BATTLE_MUSIC`, `TITLE_MUSIC`, `MAP_MUSIC`, etc.) passable to the engine; per-act wiring remains a future task

### Merchant
- [ ] **#144** Merchant rarely offers an inventory/relic item alongside cards (currently only cards)

---

## ✅ Done

- [x] Daily login reward system created (files only — integration pending above)
- [x] **#53** Campaign soft-lock fixed (pendingNodeId resume, run validation, actcomplete guard)
- [x] **#56** Campaign run-count ordinal text fixed (sixth/seventh/eighth/ninth)

> Note: GitHub API issue closing requires auth token (`GITHUB_TOKEN`). Issues must be closed manually or token added to env.
> Issues to close manually after merging: **#109**, **#117**, **#119**, **#144**
