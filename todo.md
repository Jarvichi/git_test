# Jarv's Amazing Web Game — Todo List

Issues sourced from GitHub. Last synced: 2026-03-06.

---

## 🔴 Critical Bugs

- [x] **#53** Campaign soft-lock: `pendingNodeId` left set blocks map; blank screen at act end; validate/repair all localStorage on load
- [x] **#56** Campaign run-count text always says "fifth time" after run 5 — fix to use actual count

---

## 🟠 Gameplay Bugs / Regressions

- [ ] **#63** Unit movement: units don't avoid obstacles properly (hitbox mismatch with SVG size)
- [~] **#62** Gameplay balance: Farm upgrade mana bug; structure cost vs unit cost balance

---

## 🟡 UX / UI Bugs

- [x] **#58** Screen size: battlefield + hand don't fit on small phone screens — scale to viewport
- [x] **#65** Collection screen: Upgrade/Sell buttons always visible (greyed when unavailable), add text labels
- [x] **#46** UI consistency: title screen buttons same size; collection cards same size; victory screen buttons same size

---

## 🟢 Enhancements — High Value

- [x] **#51** Daily login rewards: wire DailyLoginModal + InventoryScreen into App.tsx (files exist, not integrated)
- [x] **#57** Campaign shrines: hide expected rewards; randomise options; one option can be negative
- [x] **#59** Campaign QoL: hint after 2 failed attempts; crystals as battle reward; explain merchant when broke
- [x] **#61** Battlefield: buildings spread across multiple rows from centre; upgrade level visual feedback
- [ ] **#49** Deck builder: add sort / filter / search
- [ ] **#48** Collection screen: make sort/filter button labels obvious
- [ ] **#50** Sound: better battle music; death cries for units; crash sound for building destruction

---

## 🔵 Enhancements — Medium

- [ ] **#64** Tutorials: deck builder tutorial; gameplay tutorial; lock campaign until 30 cards collected
- [ ] **#47** Buff/upgrade cards need icons/images
- [ ] **#66** Debugging: feedback/bug submission screen; export/import localStorage behind `?debug` URL param
- [ ] **#60** Rare event — The Gambler: tap-to-guess modal, win all cards or lose everything; rubber chicken consolation; track rare event log
- [ ] **#52** More secrets scattered through the game
- [ ] **#55** Anti-hacking: checksum on card collection + inventory; warn on mismatch; safe first-load migration

---

## ⚪ Features — Large / Long-term

- [x] **#54** Intro screen: "Awesome Software Presents" logo → Jarv SVG → title (skip setting in settings)
- [ ] **#44** Battlefield z-order: water → rocks → walls → trees → surroundings; units above walls, under canopy; flyers above all
- [ ] **#45** Battlefield scenery themed to environment (rocks/water/ice/canyon)
- [ ] **#43** Flying units cast a shadow
- [ ] **#61** Battlefield: projectile animations; damage/blood augments on sprites; death/climb animations
- [ ] **#68** Dark / Light mode toggle in settings
- [ ] **#67** Cross-device persistent game state (design only for now)

---

## ✅ Done

- [x] Daily login reward system created (files only — integration pending above)
- [x] **#53** Campaign soft-lock fixed (pendingNodeId resume, run validation, actcomplete guard)
- [x] **#56** Campaign run-count ordinal text fixed (sixth/seventh/eighth/ninth)

> Note: GitHub API issue closing requires auth token (`GITHUB_TOKEN`). Issues must be closed manually or token added to env.
