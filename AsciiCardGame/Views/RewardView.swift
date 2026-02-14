import SwiftUI

struct RewardView: View {
    @EnvironmentObject var vm: GameViewModel

    var body: some View {
        VStack(spacing: 16) {
            Spacer()

            Text("=== REWARD ===")
                .foregroundColor(.yellow)

            // Treasure chest ASCII art
            Text(chestASCII)
                .font(.system(size: 14, design: .monospaced))
                .foregroundColor(.yellow)

            Text("You found a treasure chest!")
                .foregroundColor(.cyan)

            // Preview of what will be drawn
            if let topCard = vm.state.drawPile.first {
                Text("You will receive:")
                    .foregroundColor(.white)

                HStack(spacing: 16) {
                    VStack {
                        Text("Side A")
                            .foregroundColor(.cyan)
                            .font(.system(size: 10, design: .monospaced))
                        Text(topCard.asciiArt(showSideA: true))
                            .font(.system(size: 10, design: .monospaced))
                    }
                    VStack {
                        Text("Side B")
                            .foregroundColor(.red)
                            .font(.system(size: 10, design: .monospaced))
                        Text(topCard.asciiArt(showSideA: false))
                            .font(.system(size: 10, design: .monospaced))
                    }
                }

                Text(topCard.name)
                    .foregroundColor(.white)
                Text("(\(topCard.rarity.rawValue))")
                    .foregroundColor(.gray)
            } else {
                Text("(Draw pile empty - no card to gain)")
                    .foregroundColor(.gray)
            }

            Spacer()

            // Player stats
            Text(vm.playerHPBar)
            Text(vm.deckStatusLine)
                .font(.system(size: 11, design: .monospaced))

            Button(action: {
                vm.collectReward()
            }) {
                Text("[ Collect & Continue >> ]")
                    .foregroundColor(.green)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 2)
                            .stroke(Color.green, lineWidth: 1)
                    )
            }

            Spacer()
        }
        .padding()
    }

    var chestASCII: String {
        """
          _______
         /       \\
        |  ?   ?  |
        |_________|
        |         |
        |_________|
        """
    }
}
