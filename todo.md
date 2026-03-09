# Jarv's Amazing Web Game — Todo List

Issues sourced from GitHub. Last synced: 2026-03-09.

---

## 🟠 Active Work

*(none)*

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
- [ ] Act 4 — The Crystal Spire: act4.json (4-wide, 9 rows), boss The Archivist (infinite mana at turn 8+), Prism Lens relic
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

## ✅ Done

- [x] Daily login reward system created (files only — integration pending above)
- [x] **#53** Campaign soft-lock fixed (pendingNodeId resume, run validation, actcomplete guard)
- [x] **#56** Campaign run-count ordinal text fixed (sixth/seventh/eighth/ninth)

> Note: GitHub API issue closing requires auth token (`GITHUB_TOKEN`). Issues must be closed manually or token added to env.
> Issues to close manually after merging: **#109**, **#117**, **#119**
