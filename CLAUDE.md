# ASCII Card Quest — Claude Instructions

## Project Overview
A browser-based roguelike deck-building card game. The only platform is the web app (`web/`). There is no iOS app.

- **Live URL:** https://jarvichi.github.io/git_test/
- **Repo:** Jarvichi/git_test on GitHub

## Tech Stack
- React 18, TypeScript 5, Vite 5
- No UI library — custom retro ASCII/terminal styling via `web/src/styles.css`
- No test framework currently

## Project Structure
```
web/
  src/
    game/          # Pure game logic (no React)
      types.ts     # Interfaces: Card, GameState, PathNode, BattleState
      engine.ts    # Core mechanics: movement, combat, rewards, path generation
      cards.ts     # Card deck definition (20 cards, 4 rarities)
      path.ts      # Branching path generation (10 steps to boss)
    components/    # React UI
      App.tsx      # Root component, game state, phase routing
      Battle.tsx   # Combat UI
      BattleReward.tsx  # 3-card choice after battle victory
      PathMap.tsx  # ASCII branching path visualization
      Hand.tsx     # Card hand display
      CardTile.tsx # Individual card rendering
      Reward.tsx   # Treasure collection UI
      GameOver.tsx # Win/lose screen
    styles.css
  package.json
  vite.config.ts   # base: '/git_test/' for GitHub Pages
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
- **Core mechanic:** Each card has two sides — Movement (top) and Combat (bottom). Playing one side permanently discards the card.
- **Path:** 10-step branching path toward the Dragon Lord boss
- **Enemy scaling:** Goblins (steps 1-3, 8HP) → Bandits (4-6, 10HP) → Trolls (7-9, 12HP) → Dragon Lord (step 10, 15HP, 7dmg/turn)
- **Deck:** 20 cards — Common (Weak Strike, Quick Blade), Uncommon (Swift Healer, Shield Creep), Rare (Vaulter, Mend Runner), Legendary (Legend's Charge)
- **Win:** Defeat the Dragon Lord. **Lose:** Run out of HP or cards.

## GitHub & PRs
- Authenticated as: Jarvichi
- Default base branch: `main`
- Deployment triggers automatically on merge to `main`
