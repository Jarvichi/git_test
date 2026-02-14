# ASCII Card Quest

A roguelike card game where every card has two sides - use one, lose the other.

**Play now:** [https://jarvichi.github.io/git_test/](https://jarvichi.github.io/git_test/)

## How to Play

You must traverse a 10-step branching path and defeat the **Dragon Lord** boss at the end.

- You start with **7 cards** drawn from a 20-card deck
- Each card has **two sides**: a Movement side and a Combat side
- **To move**: play a card for its Movement side (the card is spent), then choose which branch to land on
- **Landing on a Battle** `[X]`: you must play a card for its Combat side to fight the enemy
- **Landing on a Reward** `[R]`: you draw a new card from the deck
- **Step 10** is the Boss fight - play combat cards until the Dragon Lord falls

**You win** if you beat the boss. **You lose** if you run out of cards or HP.

The core tension: every card you spend moving is a card you can't use in combat, and vice versa.

## Card Deck

| Card | Qty | Movement | Combat | Rarity |
|------|-----|----------|--------|--------|
| Weak Strike | 5 | Move 1 | Deal 3 dmg | Common |
| Quick Blade | 4 | Move 2 | Deal 5 dmg | Common |
| Swift Healer | 3 | Move 3 | Heal 4 HP | Uncommon |
| Shield Creep | 3 | Move 1 | Block 4 | Uncommon |
| Vaulter | 2 | Jump to Reward | Deal 8 dmg | Rare |
| Mend Runner | 2 | Move 2 | Heal 6 HP | Rare |
| Legend's Charge | 1 | Move 4 | Deal 12 dmg | Legendary |

## Project Structure

```
AsciiCardGame/          # iOS (SwiftUI) version
  Models/               # Card, PathNode, GameState
  Views/                # SwiftUI screens
  GameEngine.swift      # Pure game logic
  GameViewModel.swift   # State management

web/                    # Browser version (React + TypeScript)
  src/game/             # Types, cards, path, engine
  src/components/       # React components
  src/styles.css        # Retro terminal CSS

.github/workflows/      # GitHub Pages auto-deploy
```

## Run Locally

```bash
cd web
npm install
npm run dev
```

## Deploy

The game auto-deploys to GitHub Pages when merged to `main`. To enable:

1. Go to **Settings > Pages** in your GitHub repo
2. Set Source to **GitHub Actions**
3. Merge this branch to `main`
