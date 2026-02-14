import SwiftUI

// MARK: - Hand View (Card Selection)

struct HandView: View {
    @EnvironmentObject var vm: GameViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Player stats bar
            HStack {
                Text(vm.playerHPBar)
                Spacer()
                Text(vm.deckStatusLine)
                    .font(.system(size: 11, design: .monospaced))
            }
            .padding(.horizontal)

            Text("--- YOUR HAND (tap to use Side A: Movement) ---")
                .font(.system(size: 11, design: .monospaced))
                .foregroundColor(.yellow)
                .padding(.horizontal)

            // Cards in horizontal scroll
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(vm.state.hand) { card in
                        CardTileView(
                            card: card,
                            isSelected: vm.selectedCardForMovement?.id == card.id,
                            showSideA: true
                        )
                        .onTapGesture {
                            vm.selectCardForMovement(card)
                        }
                    }
                }
                .padding(.horizontal)
            }

            // Selected card info
            if let selected = vm.selectedCardForMovement {
                HStack {
                    Text("Selected: \(selected.name)")
                        .foregroundColor(.yellow)
                    Text("[\(selected.sideA.description)]")
                        .foregroundColor(.cyan)
                    Text("(pick destination above)")
                        .foregroundColor(.gray)
                }
                .font(.system(size: 11, design: .monospaced))
                .padding(.horizontal)
            }
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Card Tile View (Reusable)

struct CardTileView: View {
    let card: Card
    let isSelected: Bool
    let showSideA: Bool

    var body: some View {
        VStack(spacing: 2) {
            Text(card.asciiArt(showSideA: showSideA))
                .font(.system(size: 10, design: .monospaced))

            // Show both sides summary below card
            Text("\(card.sideA.description) / \(card.sideB.description)")
                .font(.system(size: 8, design: .monospaced))
                .foregroundColor(.gray)

            Text(card.name)
                .font(.system(size: 9, design: .monospaced))
                .foregroundColor(.white)
        }
        .padding(4)
        .background(isSelected ? Color.green.opacity(0.2) : Color.clear)
        .overlay(
            RoundedRectangle(cornerRadius: 2)
                .stroke(isSelected ? Color.yellow : Color.green.opacity(0.5), lineWidth: isSelected ? 2 : 1)
        )
    }
}
