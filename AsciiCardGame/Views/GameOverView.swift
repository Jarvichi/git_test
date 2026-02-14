import SwiftUI

struct GameOverView: View {
    @EnvironmentObject var vm: GameViewModel
    let won: Bool

    var body: some View {
        VStack(spacing: 16) {
            Spacer()

            if won {
                Text("=== VICTORY ===")
                    .foregroundColor(.yellow)
                    .font(.system(size: 18, design: .monospaced))

                Text(victoryASCII)
                    .font(.system(size: 14, design: .monospaced))
                    .foregroundColor(.yellow)

                Text("You defeated the Dragon Lord!")
                    .foregroundColor(.cyan)

                VStack(alignment: .leading, spacing: 4) {
                    Text("HP remaining: \(vm.state.playerHP)/\(vm.state.playerMaxHP)")
                    Text("Cards in hand: \(vm.state.hand.count)")
                    Text("Turns taken: \(vm.state.turnNumber)")
                }
                .foregroundColor(.white)
            } else {
                Text("=== DEFEAT ===")
                    .foregroundColor(.red)
                    .font(.system(size: 18, design: .monospaced))

                Text(defeatASCII)
                    .font(.system(size: 14, design: .monospaced))
                    .foregroundColor(.red)

                if vm.state.playerHP <= 0 {
                    Text("You were slain...")
                        .foregroundColor(.red)
                } else {
                    Text("You ran out of cards!")
                        .foregroundColor(.red)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Reached step: \(vm.state.currentStep)/10")
                    Text("Turns taken: \(vm.state.turnNumber)")
                }
                .foregroundColor(.gray)
            }

            Spacer()

            Button(action: {
                vm.resetGame()
            }) {
                Text("[ Play Again ]")
                    .foregroundColor(.green)
                    .font(.system(size: 16, design: .monospaced))
                    .padding(.vertical, 10)
                    .padding(.horizontal, 24)
                    .overlay(
                        RoundedRectangle(cornerRadius: 2)
                            .stroke(Color.green, lineWidth: 2)
                    )
            }

            Spacer()
        }
        .padding()
    }

    var victoryASCII: String {
        """
           \\o/
            |
           / \\
        =========
         WINNER!
        =========
        """
    }

    var defeatASCII: String {
        """
           ___
          | R |
          | I |
          | P |
          |___|
         /     \\
        """
    }
}
