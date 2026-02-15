import Foundation

// MARK: - Battle State

struct BattleState: Equatable {
    var enemyName: String
    var enemyHP: Int
    var enemyMaxHP: Int
    var enemyDamagePerTurn: Int
    var playerBlockThisTurn: Int = 0
    var log: [String] = []
    var isResolved: Bool = false
}

// MARK: - Game Phase

enum GamePhase: Equatable {
    case movement
    case battle
    case reward
    case battleReward
    case bossFight
    case gameOver(won: Bool)
}

// MARK: - Game State

struct GameState: Equatable {
    // Board
    var allNodes: [PathNode]
    var currentNodeId: UUID

    // Cards
    var hand: [Card]
    var drawPile: [Card]
    var discardPile: [Card]
    var rewardChoices: [Card] = []

    // Player
    var playerHP: Int = 20
    var playerMaxHP: Int = 20

    // Phase
    var phase: GamePhase = .movement

    // Battle
    var activeBattle: BattleState? = nil

    // Meta
    var currentStep: Int = 0
    var turnNumber: Int = 0
    var message: String = "Choose a card to move."

    // Computed
    var currentNode: PathNode? {
        allNodes.first { $0.id == currentNodeId }
    }

    var isGameOver: Bool {
        if case .gameOver = phase { return true }
        return false
    }
}

// MARK: - New Game Factory

extension GameState {
    static func newGame() -> GameState {
        let nodes = PathNode.generatePath()
        let startNode = nodes.first { $0.step == 0 }!
        var deck = Card.makeDeck().shuffled()
        let initialHand = Array(deck.prefix(7))
        let remainingDeck = Array(deck.dropFirst(7))

        return GameState(
            allNodes: nodes,
            currentNodeId: startNode.id,
            hand: initialHand,
            drawPile: remainingDeck,
            discardPile: []
        )
    }
}
