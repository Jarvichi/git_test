# Jarv's Amazing Web Game — Claude Instructions

## Project Overview
A browser-based strategy card game. Deploy units, build structures, and cast upgrades to destroy the enemy base. The only platform is the web app (`web/`).

- **Live URL:** https://jarvichi.github.io/jarvs-amazing-web-game/
- **Repo:** Jarvichi/jarvs-amazing-web-game on GitHub

## Tech Stack
- React 18, TypeScript 5, Vite 5
- No UI library — custom retro ASCII/terminal styling via `web/src/styles.css`
- No test framework currently

## Project Structure
```
web/
  src/
    game/          # Pure game logic (no React)
      types.ts     # Interfaces: Card, Unit, GameState, Base, effects
      engine.ts    # Core mechanics: mana, combat, opponent AI
      cards.ts     # Card deck (units, structures, upgrades)
    components/    # React UI
      App.tsx          # Root component, game state, phase routing
      Battlefield.tsx  # Main game screen: bases, field, hand, log
      CardTile.tsx     # Individual card rendering
      GameOver.tsx     # Win/lose screen
    styles.css
  package.json
  vite.config.ts   # base: '/jarvs-amazing-web-game/' for GitHub Pages
  tsconfig.json
.github/
  workflows/
    deploy.yml     # Auto-deploys web/dist to GitHub Pages on push to main
```

## Common Commands
All commands run from the `web/` directory:
```bash
npm run dev      # Start dev server
npm run build    # TypeScript check + Vite build
npm run preview  # Preview production build locally
```

## Game Design
- **Mana system:** Player starts with 3 mana/turn; Farms increase max mana permanently
- **Card types:** Unit (deploy fighters), Structure (build Walls/Farms/Barracks), Upgrade (buff/heal all units)
- **Combat:** All units attack simultaneously at End Turn; melee targets walls first, ranged bypasses walls
- **Opponent AI:** Plays 1–2 affordable cards per turn from its own shuffled deck
- **Win:** Destroy the enemy base (20 HP). **Lose:** Your base reaches 0 HP.

## Permissions
- Claude has full permission to push and merge code changes

## GitHub & PRs
- Authenticated as: Jarvichi
- Default base branch: `main`
- Deployment triggers automatically on merge to `main`
