import SwiftUI

final class GameViewModel: ObservableObject {

    @Published var state: GameState = GameState.newGame()

    // UI selection state
    @Published var selectedCardForMovement: Card? = nil
    @Published var movementTargets: [UUID] = []

    // MARK: - Movement Phase Actions

    /// Player taps a card during movement phase - shows valid destinations.
    func selectCardForMovement(_ card: Card) {
        selectedCardForMovement = card
        movementTargets = GameEngine.resolveMovementTargets(card: card, state: state)
    }

    /// Player confirms a destination after selecting a movement card.
    func confirmMovement(destinationId: UUID) {
        guard let card = selectedCardForMovement else { return }
        state = GameEngine.playCardForMovement(
            state: state,
            cardId: card.id,
            destinationId: destinationId
        )
        selectedCardForMovement = nil
        movementTargets = []
    }

    // MARK: - Combat Phase Actions

    /// Player plays a card for combat during battle or boss fight.
    func playCardForCombat(_ card: Card) {
        state = GameEngine.playCardForCombat(state: state, cardId: card.id)
    }

    // MARK: - Reward Phase Actions

    func collectReward() {
        state = GameEngine.collectReward(state: state)
    }

    // MARK: - Battle Reward Phase Actions

    func collectBattleReward(cardId: UUID) {
        state = GameEngine.collectBattleReward(state: state, chosenCardId: cardId)
    }

    func skipBattleReward() {
        state = GameEngine.skipBattleReward(state: state)
    }

    // MARK: - Game Control

    func resetGame() {
        state = GameState.newGame()
        selectedCardForMovement = nil
        movementTargets = []
    }

    // MARK: - Display Helpers

    var pathMapASCII: String {
        GameEngine.renderPathMap(state: state)
    }

    var playerHPBar: String {
        let filled = max(0, Int((Double(state.playerHP) / Double(state.playerMaxHP)) * 10))
        let empty = 10 - filled
        return "HP [\(String(repeating: "#", count: filled))\(String(repeating: ".", count: empty))] \(state.playerHP)/\(state.playerMaxHP)"
    }

    var deckStatusLine: String {
        "Draw:\(state.drawPile.count) | Discard:\(state.discardPile.count) | Hand:\(state.hand.count)"
    }

    var enemyHPBar: String {
        guard let battle = state.activeBattle else { return "" }
        let filled = max(0, Int((Double(battle.enemyHP) / Double(battle.enemyMaxHP)) * 10))
        let empty = 10 - filled
        return "\(battle.enemyName) [\(String(repeating: "#", count: filled))\(String(repeating: ".", count: empty))] \(battle.enemyHP)/\(battle.enemyMaxHP)"
    }
}
