# Jarv's Amazing Web Game — Todo List

Issues sourced from GitHub. Last synced: 2026-03-14 (session 6).

---

When working an issue from this file, go and check the GitHub issue for additional detail and requirements before planning the solution, create a todo list based on the plan and execute it. If running in the cli you can usually use the "gh" cli commands to help, however if they are not available use a fallback method.

---

## 🟠 Active Work

- [x] **#192** Campaign events: health bar doesn't update when a damaging choice is made — add HP display to EventScreen with live damage preview
- [x] **#193** Stuck units: add `?debug` overlay that renders terrain avoidance areas as semi-transparent red circles on the battlefield



- [x] **#167** Settings Screen: overflow doesn't scroll on small devices — add `min-height: 0` to `.settings-body`
- [x] **#143** Campaign map: visited nodes full brightness + ✓ tick — already fixed
- [x] **#149** Campaign events: acts 2/3 reuse Act 1 text — already fixed
- [x] **#151** Title screen "Deck: X cards" label — already fixed
- [x] **#155** Inventory item pool + random rewards across all act events (see UX section)
- [x] **Event randomisation** — act2 supply-cache expanded from deterministic single-choice pools to full random-outcome pools; `gainItem` (random pool, no itemId) added to events in acts 2, 3, 4

---

## 🟡 UX / UI Bugs (session 6 — new)

- [ ] **#183** Intro Screen: fade between "Awesome Software" and "A Jarv Creation" shows the title screen behind it — ensure the fade does not reveal the title screen
- [ ] **#184** Settings: text size setting doesn't change anything — wire up the setting to actually apply font size
- [ ] **#185** Settings: text colour setting doesn't change anything — wire up the setting to actually apply text colour
- [x] **#186** Achievements: add an indicator/badge on the achievements button on the title screen when there's an unclaimed reward — red `!` badge shown when any achievement is unlocked but unclaimed

---

## 🔴 Critical Bugs

- [x] **#97** Campaign: Act 2 event/shrine nodes launch a battle instead — fixed by user's "add events" commit (supply-cache/goblin-deal/wanderer/ambush-merchant added to events.json) — needs manual close on GitHub
- [x] **#53** Campaign soft-lock: `pendingNodeId` left set blocks map; blank screen at act end; validate/repair all localStorage on load
- [x] **#56** Campaign run-count text always says "fifth time" after run 5 — fix to use actual count
- [x] **Intro always says "tenth"** (no issue#) — runs 11–24 (and 26–49 etc.) still show milestone run text
- [x] **#90** Campaign events (shrine/ruins): result screen dismisses too fast — EventScreen already has CONTINUE button; already fixed — needs manual close on GitHub

---

## 🟠 Gameplay Bugs (new)

- [x] **#148** Cheating: refreshing during a battle resets it — already fixed
- [x] **#149** Campaign events: events in acts 2/3 reuse Act 1 text — already fixed

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

## 🟡 UX / UI Bugs (new)

- [x] **#155** Inventory items: too many duplicate items granted — 423 items in `items.json`, unified `rewards.json`, weight-based `computeReward()` with dupe-skipping, daily login + all campaign events feed through same system; `gainItem` entries in all act event nodes draw from random pool
- [x] **#151** Title screen: "Deck: X cards" label is confusing — replace with a badge on Deck Builder button when unused cards exist; show "Collection X/Y" (unlocked/total) instead
- [x] **#143** Campaign map: visited nodes should render at full brightness with a solid fill and a ✓ tick overlay

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

## 🔵 Enhancements — Medium (new)

- [x] **#150** Handle updates: auto-reload the PWA when a new version is deployed; show build ID in Settings → About — already fixed
- [x] **#146** Achievements: add "Campaign Failed" achievement; "100 Losses" and "1000 Losses" milestones
- [x] **#140** Act 4 achievements: no achievements currently fire for Act 4 completion — wire up the same hooks as Acts 1–3

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

## ⚪ Features — Large / Long-term (new)

- [ ] **#156** Hero card preview: title screen button → page showing all Hero Cards; tap opens card detail modal with lore
- [ ] **#158 / #157** Strengths & weaknesses: each unit gets 2 strengths and 2 weaknesses (e.g. Catapult weak to fire; Archer strong vs flying/slow, weak vs melee/fast); shown in card detail modal; applied as damage multipliers in engine (#157 is a duplicate of #158)
- [ ] **#159** Affinity system: units near same-type or paired units gain a buff or special ability (e.g. Archers near Archers → "Archer's Tempo" faster fire rate; Dragon flies over Catapult to protect it; Skeletons rally to Necromancer); design affinities for all units
- [ ] **#152** Endless mode: continuous waves — opponent dies, stronger one spawns; buildings limited to 3 rows; survive as long as possible; survival-time achievements

---

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

## 🗺️ Acts System — Sub-issues from #144 (see docs/acts.md)

Sub-issues created for each unimplemented item from the closed #144. Reference `docs/acts.md` for full specs.

### Campaign Map
- [ ] **#171** Mystery node: runtime replacement of a normal battle node; displayed as normal battle on map; on entry shows cleared battlefield + reward chest + lore text ("whoops, forgot to clean up")
- [ ] **#172** Node peek modal: tapping a node shows a preview modal with reward summary, difficulty hint, "Enter Battle" + "Back" buttons; on previously-completed nodes also shows opponent deck + playstyle

### Boss Mechanic
- [ ] **#173** Boss card mechanic: boss node opponent gets a boss card instead of hero; when opponent base hits 0 HP, base restores to full and boss unit deploys; player must kill the boss unit to win — add `bossCard` field to QuestNode, `bossCardActive` flag to GameState, intercept game-over in engine.ts

### Campaign Structure
- [ ] **#180** Extend campaign to 25 acts (currently 4); plan and write acts 5–25 story, node maps, bosses, relics, hero cards, themed card sets
- [ ] **#181** Second 25-act story arc: after act 25 completes, a new 25-act arc begins in the same world with a new plot

### Replay System
- [ ] **#175** Per-run modifiers: each replay of an act adds an escalating modifier (e.g. +X% enemy HP, faster opponent mana); configure modifier list in act JSON as `replayModifiers` array
- [ ] **#144** Boss dialogue run-awareness: support substitution tags (`{n}`, `{ordinalLower}`) inside `bossDialogue` strings (currently plain text only)
- [ ] **#144** Global word substitution config: a separate JSON file (`web/src/data/wordVariants.json`) holding single-word alternate arrays usable as `{word:key}` tags in any act text

### Relics
- [ ] **#174** Relic selection screen + breaking: pick 1 relic to equip at act start; 50% break chance on completion; broken relics greyed out in inventory; re-earn by replaying the act

### Lives System
- [x] **#144** Add 3 lives to RunState (`livesRemaining`, `maxLives`); on battle loss player loses 1 life and can retry; at 0 lives show Campaign Failed screen (+50 crystals reward); lives reset to min 3 at act completion; relics/events can grant lives up to 9; shown in NodeMap HUD; "Nine Lives" achievement
- [x] **#144** Campaign Failed screen: 50 crystal reward, clear run, return to menu

### Cards
- [ ] **#177** Add `lore` field to card schema (cards.json + TypeScript types) for per-card flavour text
- [ ] **#178** Per-act themed card sets: at least 25 cards per act, tagged to that act's theme, earnable only in that act (except daily/crystal rewards)

### Music
- [x] **#144** Refactor sound.ts: export `MusicTrackConfig` type and `startMusicTrack`/`stopMusicTrack` generic API; named config objects (`BATTLE_MUSIC`, `TITLE_MUSIC`, `MAP_MUSIC`, etc.) passable to the engine; per-act wiring remains a future task
- [ ] **#176** Per-act music: add `mapMusic`, `battleMusic`, `bossMusic` fields to act JSON; wire to startMusicTrack calls

### Merchant
- [ ] **#179** Merchant rarely offers an inventory item alongside cards (currently only cards)

---

## ✅ Done

- [x] Daily login reward system created (files only — integration pending above)
- [x] **#53** Campaign soft-lock fixed (pendingNodeId resume, run validation, actcomplete guard)
- [x] **#56** Campaign run-count ordinal text fixed (sixth/seventh/eighth/ninth)

> Note: GitHub API issue closing requires auth token (`GITHUB_TOKEN`). Issues must be closed manually or token added to env. Always check for a local .env file, if one doesn't exist update this file to note what has changed, and that the todo is complete.
> Issues to close manually after merging: none outstanding (all previously flagged are closed)
