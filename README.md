# Jarv's Amazing Web Game

A browser-based strategy card game. Deploy units, build structures, and cast upgrades to destroy the enemy base before yours falls.

**Play now:** [https://jarvichi.github.io/jarvs-amazing-web-game/](https://jarvichi.github.io/jarvs-amazing-web-game/)

## How to Play

- Each turn you have **mana** (starts at 3, grows with Farms)
- Play cards from your hand to **deploy units**, **build structures**, or **cast upgrades**
- Click **End Turn** — all units fight simultaneously, then the opponent plays their turn
- **Win** by reducing the enemy base to 0 HP. **Lose** if your base falls.

## Units

| Unit | Cost | Attack | HP | Notes |
|------|------|--------|----|-------|
| Goblin | 1 | 2 | 3 | Melee — targets walls first |
| Archer | 1 | 2 | 3 | Ranged — bypasses walls |
| Barbarian | 2 | 4 | 4 | Melee — hard-hitting |
| Knight | 2 | 3 | 7 | Melee — armored tank |
| Wizard | 3 | 5 | 3 | Ranged — bypasses walls |
| Dragon | 4 | 8 | 7 | Ranged — bypasses walls |

## Structures

| Structure | Cost | HP | Effect |
|-----------|------|----|--------|
| Wall | 1 | 10 | Absorbs melee attacks before other units |
| Farm | 2 | 6 | +1 max mana per turn while standing |
| Barracks | 3 | 8 | Draw +1 card at the start of each turn |

## Upgrades

| Card | Cost | Effect |
|------|------|--------|
| Sharpen Blades | 2 | All your units permanently gain +2 attack |
| Fortify | 2 | Heal all your units for 4 HP |

## Targeting Rules

- **Melee units** — attack walls first → then other units/structures → then the base
- **Ranged units** — skip walls, attack other units/structures → then the base

## Run Locally

```bash
cd web
npm install
npm run dev
```

## Deploy

The game auto-deploys to GitHub Pages when merged to `main` via GitHub Actions.
