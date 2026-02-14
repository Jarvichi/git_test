import SwiftUI

struct BattleView: View {
    @EnvironmentObject var vm: GameViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("=== BATTLE ===")
                .foregroundColor(.red)

            if let battle = vm.state.activeBattle {
                // Enemy ASCII portrait
                Text(enemyASCII(name: battle.enemyName))
                    .font(.system(size: 14, design: .monospaced))
                    .foregroundColor(.red)

                // Enemy HP bar
                Text(vm.enemyHPBar)
                    .foregroundColor(.red)
                Text("ATK: \(battle.enemyDamagePerTurn)/turn  Block: \(battle.playerBlockThisTurn)")
                    .foregroundColor(.orange)

                Divider().background(Color.green)

                // Combat log
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 2) {
                        ForEach(Array(battle.log.suffix(6).enumerated()), id: \.offset) { _, entry in
                            Text("> \(entry)")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundColor(.white)
                        }
                    }
                }
                .frame(maxHeight: 80)

                Divider().background(Color.green)
            }

            // Player stats
            Text(vm.playerHPBar)
            Text(vm.deckStatusLine)
                .font(.system(size: 11, design: .monospaced))

            Text("--- PLAY A CARD (Side B: Combat) ---")
                .foregroundColor(.yellow)
                .font(.system(size: 11, design: .monospaced))

            // Combat hand
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(vm.state.hand) { card in
                        CardTileView(card: card, isSelected: false, showSideA: false)
                            .onTapGesture {
                                vm.playCardForCombat(card)
                            }
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding()
    }

    func enemyASCII(name: String) -> String {
        switch name {
        case "Goblin":
            return """
              ,--,
             (o  o)
              >--<
             /|  |\\
            """
        case "Bandit":
            return """
              [==]
             (B  B)
              >--<
             /|  |\\
            """
        case "Troll":
            return """
             .----.
            (O    O)
             >----<
            /||  ||\\
            """
        default:
            return """
              ????
             (?  ?)
              >--<
             /|  |\\
            """
        }
    }
}
