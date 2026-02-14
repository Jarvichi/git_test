import SwiftUI

struct BossFightView: View {
    @EnvironmentObject var vm: GameViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("!!! BOSS FIGHT !!!")
                .foregroundColor(.red)
                .font(.system(size: 16, design: .monospaced))

            // Boss ASCII art
            Text(bossASCII)
                .font(.system(size: 12, design: .monospaced))
                .foregroundColor(.red)

            if let battle = vm.state.activeBattle {
                // Boss HP bar
                Text(vm.enemyHPBar)
                    .foregroundColor(.red)
                Text("ATK: \(battle.enemyDamagePerTurn)/turn  Your Block: \(battle.playerBlockThisTurn)")
                    .foregroundColor(.orange)

                Divider().background(Color.red)

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

                Divider().background(Color.red)
            }

            // Player stats
            Text(vm.playerHPBar)
            Text(vm.deckStatusLine)
                .font(.system(size: 11, design: .monospaced))

            Text("--- USE COMBAT CARDS TO DEFEAT THE BOSS ---")
                .foregroundColor(.yellow)
                .font(.system(size: 10, design: .monospaced))

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

            if vm.state.hand.isEmpty {
                Text("NO CARDS LEFT!")
                    .foregroundColor(.red)
                    .font(.system(size: 14, design: .monospaced))
            }
        }
        .padding()
    }

    var bossASCII: String {
        """
            /\\_/\\
           ( o.o )
            > ^ <
           /|   |\\
          (_|   |_)
         DRAGON LORD
        """
    }
}
