import Foundation

// MARK: - Card Effect (Extensible)
// A single enum for ALL possible card effects.
// To add new effect types (trap, scout, steal, etc.), just add cases here.
// Each card has two sides, each side is a CardEffect.

enum CardEffect: Equatable {
    // Movement effects
    case moveSteps(Int)
    case jumpToNextReward

    // Combat effects
    case dealDamage(Int)
    case healHP(Int)
    case block(Int)

    // Future effects can be added here, e.g.:
    // case scout(Int)        - peek at upcoming spaces
    // case trap(Int)         - place a trap for enemies
    // case steal             - take an enemy's card
    // case teleport          - move to any visible node

    /// Human-readable description for display.
    var description: String {
        switch self {
        case .moveSteps(let n):   return "Move \(n)"
        case .jumpToNextReward:   return "Jump->Rwd"
        case .dealDamage(let n):  return "Deal \(n)dmg"
        case .healHP(let n):     return "Heal \(n)HP"
        case .block(let n):      return "Block \(n)"
        }
    }

    /// Short label for the card header.
    var categoryLabel: String {
        switch self {
        case .moveSteps, .jumpToNextReward: return "MOV"
        case .dealDamage:                   return "ATK"
        case .healHP:                       return "HEL"
        case .block:                        return "DEF"
        }
    }

    /// Whether this effect can be used during movement phase.
    var isMovementEffect: Bool {
        switch self {
        case .moveSteps, .jumpToNextReward: return true
        default: return false
        }
    }

    /// Whether this effect can be used during combat phase.
    var isCombatEffect: Bool {
        switch self {
        case .dealDamage, .healHP, .block: return true
        default: return false
        }
    }
}

// MARK: - Card Rarity

enum CardRarity: String {
    case common, uncommon, rare, legendary

    var stars: String {
        switch self {
        case .common:    return "*"
        case .uncommon:  return "**"
        case .rare:      return "***"
        case .legendary: return "****"
        }
    }
}

// MARK: - Card

/// A card always has exactly two sides. The player chooses which side to use.
/// Side A is typically the movement option, Side B the combat option,
/// but the system supports any combination of effects.
struct Card: Identifiable, Equatable {
    let id: UUID
    let name: String
    let rarity: CardRarity
    let sideA: CardEffect
    let sideB: CardEffect

    /// ASCII card art (9 wide x 7 tall) showing one side.
    func asciiArt(showSideA: Bool) -> String {
        let effect = showSideA ? sideA : sideB
        let label = effect.categoryLabel
        let desc = effect.description
        let padded = desc.padding(toLength: 7, withPad: " ", startingAt: 0)
        let stars = rarity.stars.padding(toLength: 4, withPad: " ", startingAt: 0)
        return """
        ┌───────┐
        │ \(label)   │
        │       │
        │\(padded)│
        │       │
        │  \(stars) │
        └───────┘
        """
    }
}

// MARK: - Balanced Deck Factory

extension Card {
    /// Creates the full 20-card deck (unshuffled).
    /// Each card has two sides: typically a movement effect and a combat effect.
    static func makeDeck() -> [Card] {
        var cards: [Card] = []

        // 5x Weak Strike: Move 1 / Deal 3 dmg (common)
        for _ in 0..<5 {
            cards.append(Card(
                id: UUID(), name: "Weak Strike", rarity: .common,
                sideA: .moveSteps(1), sideB: .dealDamage(3)
            ))
        }
        // 4x Quick Blade: Move 2 / Deal 5 dmg (common)
        for _ in 0..<4 {
            cards.append(Card(
                id: UUID(), name: "Quick Blade", rarity: .common,
                sideA: .moveSteps(2), sideB: .dealDamage(5)
            ))
        }
        // 3x Swift Healer: Move 3 / Heal 4 HP (uncommon)
        for _ in 0..<3 {
            cards.append(Card(
                id: UUID(), name: "Swift Healer", rarity: .uncommon,
                sideA: .moveSteps(3), sideB: .healHP(4)
            ))
        }
        // 3x Shield Creep: Move 1 / Block 4 (uncommon)
        for _ in 0..<3 {
            cards.append(Card(
                id: UUID(), name: "Shield Creep", rarity: .uncommon,
                sideA: .moveSteps(1), sideB: .block(4)
            ))
        }
        // 2x Vaulter: Jump to Reward / Deal 8 dmg (rare)
        for _ in 0..<2 {
            cards.append(Card(
                id: UUID(), name: "Vaulter", rarity: .rare,
                sideA: .jumpToNextReward, sideB: .dealDamage(8)
            ))
        }
        // 2x Mend Runner: Move 2 / Heal 6 HP (rare)
        for _ in 0..<2 {
            cards.append(Card(
                id: UUID(), name: "Mend Runner", rarity: .rare,
                sideA: .moveSteps(2), sideB: .healHP(6)
            ))
        }
        // 1x Legend's Charge: Move 4 / Deal 12 dmg (legendary)
        cards.append(Card(
            id: UUID(), name: "Legend's Charge", rarity: .legendary,
            sideA: .moveSteps(4), sideB: .dealDamage(12)
        ))

        return cards
    }
}
