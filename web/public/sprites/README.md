# Sprites

Drop PNG or SVG files here. The game tries `{slug}.png` first, then `{slug}.svg`.
If neither is found, the unit appears as a text label (existing behaviour).

## Naming convention

File names are derived from the **unit's in-game name**, lowercased with
spaces/symbols replaced by hyphens:

| Unit / Building | File name            |
|-----------------|----------------------|
| Goblin          | `goblin.png`         |
| Archer          | `archer.png`         |
| Barbarian       | `barbarian.png`      |
| Knight          | `knight.png`         |
| Wizard          | `wizard.png`         |
| Dragon          | `dragon.png`         |
| Wall            | `wall.png`           |
| Farm            | `farm.png`           |
| Barracks        | `barracks.png`       |
| Arc.Tower       | `arcane-tower.png`   |
| DrgnLair        | `dragon-lair.png`    |

## Tips

- Pixel art works great — CSS `image-rendering: pixelated` is already set.
- Recommended canvas: **32×32** or **64×64** px for crisp scaling.
- SVGs scale perfectly at any size with no quality loss.
- Lane display: max **32×28** px. Card display: max **64×40** px.
