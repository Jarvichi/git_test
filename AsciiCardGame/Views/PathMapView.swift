import SwiftUI

struct PathMapView: View {
    @EnvironmentObject var vm: GameViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("=== PATH: Step \(vm.state.currentStep)/10 ===")
                .foregroundColor(.yellow)
                .padding(.bottom, 2)

            // Status message
            Text(vm.state.message)
                .foregroundColor(.cyan)
                .padding(.bottom, 4)

            // ASCII map
            ScrollView(.vertical, showsIndicators: false) {
                Text(vm.pathMapASCII)
                    .font(.system(size: 12, design: .monospaced))
                    .lineSpacing(1)

                // Destination picker (shown when card is selected)
                if !vm.movementTargets.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("--- Choose Destination ---")
                            .foregroundColor(.yellow)
                            .padding(.top, 8)

                        ForEach(vm.movementTargets, id: \.self) { nodeId in
                            if let node = vm.state.allNodes.first(where: { $0.id == nodeId }) {
                                Button(action: {
                                    vm.confirmMovement(destinationId: nodeId)
                                }) {
                                    Text("  >> \(node.symbol) Step \(node.step) - \(node.typeLabel)")
                                        .foregroundColor(.green)
                                        .padding(.vertical, 4)
                                        .padding(.horizontal, 8)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 2)
                                                .stroke(Color.green, lineWidth: 1)
                                        )
                                }
                            }
                        }
                    }
                }
            }
        }
        .padding(.horizontal)
        .padding(.top, 8)
    }
}
