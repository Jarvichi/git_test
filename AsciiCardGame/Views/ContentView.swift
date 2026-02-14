import SwiftUI

struct ContentView: View {
    @EnvironmentObject var vm: GameViewModel

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            switch vm.state.phase {
            case .movement:
                MovementView()
                    .environmentObject(vm)
            case .battle:
                BattleView()
                    .environmentObject(vm)
            case .reward:
                RewardView()
                    .environmentObject(vm)
            case .bossFight:
                BossFightView()
                    .environmentObject(vm)
            case .gameOver(let won):
                GameOverView(won: won)
                    .environmentObject(vm)
            }
        }
        .font(.system(.body, design: .monospaced))
        .foregroundColor(.green)
    }
}

// MARK: - Movement Phase Layout

struct MovementView: View {
    @EnvironmentObject var vm: GameViewModel

    var body: some View {
        VStack(spacing: 0) {
            PathMapView()
                .environmentObject(vm)
                .frame(maxHeight: .infinity)

            Divider().background(Color.green)

            HandView()
                .environmentObject(vm)
                .frame(maxHeight: UIScreen.main.bounds.height * 0.4)
        }
    }
}
