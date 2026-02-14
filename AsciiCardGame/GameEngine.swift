import Foundation

struct GameEngine {

    // MARK: - Movement Target Resolution

    /// Given a card and current state, returns node IDs the player can move to.
    static func resolveMovementTargets(card: Card, state: GameState) -> [UUID] {
        switch card.sideA {
        case .moveSteps(let n):
            let targetStep = min(state.currentStep + n, 10)
            return state.allNodes
                .filter { $0.step == targetStep }
                .map { $0.id }

        case .jumpToNextReward:
            // Find nearest step ahead with a reward node
            for step in (state.currentStep + 1)...10 {
                let rewardNodes = state.allNodes.filter { $0.step == step && $0.spaceType == .reward }
                if !rewardNodes.isEmpty {
                    return rewardNodes.map { $0.id }
                }
            }
            // Fallback: move 1 step
            return state.allNodes
                .filter { $0.step == state.currentStep + 1 }
                .map { $0.id }

        default:
            // Non-movement effect on side A: move 1 step as fallback
            return state.allNodes
                .filter { $0.step == state.currentStep + 1 }
                .map { $0.id }
        }
    }

    // MARK: - Play Card for Movement

    /// Plays a card for its movement side, landing on the chosen destination.
    static func playCardForMovement(
        state: GameState,
        cardId: UUID,
        destinationId: UUID
    ) -> GameState {
        var newState = state

        // Remove card from hand to discard
        guard let cardIndex = newState.hand.firstIndex(where: { $0.id == cardId }) else {
            return state
        }
        let card = newState.hand.remove(at: cardIndex)
        newState.discardPile.append(card)
        newState.turnNumber += 1

        // Move to destination
        guard let destNode = newState.allNodes.first(where: { $0.id == destinationId }) else {
            return state
        }

        // Mark current node as visited
        if let idx = newState.allNodes.firstIndex(where: { $0.id == newState.currentNodeId }) {
            newState.allNodes[idx].isVisited = true
        }

        newState.currentNodeId = destinationId
        newState.currentStep = destNode.step

        // Mark destination as visited
        if let idx = newState.allNodes.firstIndex(where: { $0.id == destinationId }) {
            newState.allNodes[idx].isVisited = true
        }

        // Transition phase based on space type
        switch destNode.spaceType {
        case .battle:
            let battle = enemyForStep(destNode.step)
            newState.activeBattle = battle
            newState.phase = .battle
            newState.message = "A \(battle.enemyName) blocks your path!"

        case .reward:
            newState.phase = .reward
            newState.message = "You found a treasure!"

        case .boss:
            let battle = BattleState(
                enemyName: "DRAGON LORD",
                enemyHP: 15,
                enemyMaxHP: 15,
                enemyDamagePerTurn: 7
            )
            newState.activeBattle = battle
            newState.phase = .bossFight
            newState.message = "The DRAGON LORD awaits!"

        case .start:
            break
        }

        // Check lose condition: out of cards during battle
        if newState.hand.isEmpty && (newState.phase == .battle || newState.phase == .bossFight) {
            newState.phase = .gameOver(won: false)
            newState.message = "You have no cards left!"
        }

        return newState
    }

    // MARK: - Play Card for Combat

    /// Plays a card for its combat side during battle or boss fight.
    static func playCardForCombat(state: GameState, cardId: UUID) -> GameState {
        var newState = state
        guard var battle = newState.activeBattle else { return state }

        // Remove card from hand to discard
        guard let cardIndex = newState.hand.firstIndex(where: { $0.id == cardId }) else {
            return state
        }
        let card = newState.hand.remove(at: cardIndex)
        newState.discardPile.append(card)
        newState.turnNumber += 1

        // Apply combat effect (use side B)
        switch card.sideB {
        case .dealDamage(let dmg):
            battle.enemyHP -= dmg
            battle.log.append("You deal \(dmg) damage!")

        case .healHP(let hp):
            let healed = min(hp, newState.playerMaxHP - newState.playerHP)
            newState.playerHP += healed
            battle.log.append("You heal \(healed) HP!")

        case .block(let blk):
            battle.playerBlockThisTurn += blk
            battle.log.append("You raise a shield! (+\(blk) block)")

        default:
            // Non-combat effect used in combat - no combat effect
            battle.log.append("That card has no combat effect!")
        }

        // Check if enemy defeated
        if battle.enemyHP <= 0 {
            battle.enemyHP = 0
            battle.isResolved = true
            battle.log.append("\(battle.enemyName) defeated!")
            newState.activeBattle = battle

            if newState.phase == .bossFight {
                newState.phase = .gameOver(won: true)
                newState.message = "You defeated the DRAGON LORD!"
            } else {
                // Battle won, return to movement
                newState.activeBattle = nil
                newState.phase = .movement
                newState.message = "Victory! Choose your next move."
            }
            return newState
        }

        // Enemy attacks back
        let damageTaken = max(0, battle.enemyDamagePerTurn - battle.playerBlockThisTurn)
        newState.playerHP -= damageTaken
        battle.playerBlockThisTurn = 0 // Reset block after enemy turn

        if damageTaken > 0 {
            battle.log.append("\(battle.enemyName) hits you for \(damageTaken) damage!")
        } else {
            battle.log.append("Your shield absorbs the blow!")
        }

        newState.activeBattle = battle

        // Check lose conditions
        if newState.playerHP <= 0 {
            newState.playerHP = 0
            newState.phase = .gameOver(won: false)
            newState.message = "You have been slain..."
            return newState
        }

        if newState.hand.isEmpty {
            newState.phase = .gameOver(won: false)
            newState.message = "You have no cards left!"
            return newState
        }

        return newState
    }

    // MARK: - Collect Reward

    /// Draws a card from the draw pile into hand.
    static func collectReward(state: GameState) -> GameState {
        var newState = state

        if newState.drawPile.isEmpty && !newState.discardPile.isEmpty {
            // Reshuffle discard into draw pile
            newState.drawPile = newState.discardPile.shuffled()
            newState.discardPile = []
        }

        if let card = newState.drawPile.first {
            newState.drawPile.removeFirst()
            newState.hand.append(card)
            newState.message = "You drew \(card.name)! Choose your next move."
        } else {
            newState.message = "No cards to draw. Choose your next move."
        }

        newState.phase = .movement
        return newState
    }

    // MARK: - Enemy Templates

    /// Returns an enemy appropriate for the given step.
    static func enemyForStep(_ step: Int) -> BattleState {
        switch step {
        case 1...3:
            return BattleState(
                enemyName: "Goblin", enemyHP: 8, enemyMaxHP: 8, enemyDamagePerTurn: 3
            )
        case 4...6:
            return BattleState(
                enemyName: "Bandit", enemyHP: 10, enemyMaxHP: 10, enemyDamagePerTurn: 4
            )
        case 7...9:
            return BattleState(
                enemyName: "Troll", enemyHP: 12, enemyMaxHP: 12, enemyDamagePerTurn: 5
            )
        default:
            return BattleState(
                enemyName: "Shadow", enemyHP: 8, enemyMaxHP: 8, enemyDamagePerTurn: 3
            )
        }
    }

    // MARK: - ASCII Path Map Rendering

    /// Renders the full path as an ASCII string (step 10 at top, step 0 at bottom).
    static func renderPathMap(state: GameState) -> String {
        var lines: [String] = []

        for step in stride(from: 10, through: 0, by: -1) {
            let nodesAtStep = state.allNodes
                .filter { $0.step == step }
                .sorted { $0.branchIndex < $1.branchIndex }

            var nodeLine = "Step\(String(format: "%2d", step)): "

            for node in nodesAtStep {
                let sym: String
                if node.id == state.currentNodeId {
                    sym = ">\(node.symbol)<"
                } else if node.isVisited {
                    // Show visited with dot
                    let inner = String(node.symbol.dropFirst().dropLast())
                    sym = "[\(inner).]"
                } else {
                    sym = " \(node.symbol) "
                }
                nodeLine += sym + "  "
            }

            lines.append(nodeLine)

            // Add connector line (except after step 0)
            if step > 0 {
                let connectorCount = nodesAtStep.count
                var connector = "         "
                for _ in 0..<connectorCount {
                    connector += "  |    "
                }
                lines.append(connector)
            }
        }

        return lines.joined(separator: "\n")
    }
}
