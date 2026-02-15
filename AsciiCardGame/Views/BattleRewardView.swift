import SwiftUI

struct BattleRewardView: View {
    @EnvironmentObject var vm: GameViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Spacer().frame(height: 16)

                Text("=== BATTLE REWARD ===")
                    .foregroundColor(.yellow)

                Text(victoryASCII)
                    .font(.system(size: 14, design: .monospaced))
                    .foregroundColor(.yellow)

                Text("Choose 1 of \(vm.state.rewardChoices.count) cards:")
                    .foregroundColor(.cyan)

                ForEach(vm.state.rewardChoices) { card in
                    VStack(spacing: 8) {
                        HStack(spacing: 16) {
                            VStack {
                                Text("Side A")
                                    .foregroundColor(.cyan)
                                    .font(.system(size: 10, design: .monospaced))
                                Text(card.asciiArt(showSideA: true))
                                    .font(.system(size: 10, design: .monospaced))
                            }
                            VStack {
                                Text("Side B")
                                    .foregroundColor(.red)
                                    .font(.system(size: 10, design: .monospaced))
                                Text(card.asciiArt(showSideA: false))
                                    .font(.system(size: 10, design: .monospaced))
                            }
                        }

                        Text("\(card.name) (\(card.rarity.rawValue))")
                            .foregroundColor(.white)
                            .font(.system(size: 12, design: .monospaced))

                        Button(action: {
                            vm.collectBattleReward(cardId: card.id)
                        }) {
                            Text("[ Pick this card ]")
                                .foregroundColor(.green)
                                .padding(.vertical, 6)
                                .padding(.horizontal, 12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 2)
                                        .stroke(Color.green, lineWidth: 1)
                                )
                        }
                    }
                    .padding(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 4)
                            .stroke(Color.green.opacity(0.3), lineWidth: 1)
                    )
                }

                // Player stats
                Text(vm.playerHPBar)
                Text(vm.deckStatusLine)
                    .font(.system(size: 11, design: .monospaced))

                Button(action: {
                    vm.skipBattleReward()
                }) {
                    Text("[ Skip Reward >> ]")
                        .foregroundColor(.green)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 2)
                                .stroke(Color.green, lineWidth: 1)
                        )
                }

                Spacer().frame(height: 16)
            }
            .padding()
        }
    }

    var victoryASCII: String {
        """
        ╔═══════╗
        ║ ★ ★ ★ ║
        ║VICTORY!║
        ║ ★ ★ ★ ║
        ╚═══════╝
        """
    }
}
