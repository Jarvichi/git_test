import Foundation

// MARK: - Space Type

enum SpaceType: Equatable {
    case start
    case battle
    case reward
    case boss
}

// MARK: - Path Node

struct PathNode: Identifiable, Equatable {
    let id: UUID
    let step: Int           // 0 = start, 1-9 = path, 10 = boss
    let branchIndex: Int    // 0, 1, or 2 within a step
    let spaceType: SpaceType

    var isVisited: Bool = false
    var childIds: [UUID] = []

    var symbol: String {
        switch spaceType {
        case .start:  return "[@]"
        case .battle: return "[X]"
        case .reward: return "[R]"
        case .boss:   return "[!]"
        }
    }

    var typeLabel: String {
        switch spaceType {
        case .start:  return "Start"
        case .battle: return "Battle"
        case .reward: return "Reward"
        case .boss:   return "BOSS"
        }
    }
}

// MARK: - Path Generation

extension PathNode {
    /// Generates a branching path with 10 steps.
    /// Steps alternate between 2 and 3 branches.
    /// Each step guarantees at least one reward and one battle option.
    static func generatePath() -> [PathNode] {
        var nodes: [PathNode] = []

        // Step 0: Start
        let startNode = PathNode(id: UUID(), step: 0, branchIndex: 0, spaceType: .start)
        nodes.append(startNode)

        // Steps 1-9: branching path
        // Branch counts: [2, 3, 2, 3, 2, 3, 2, 3, 2]
        // Layout ensures each step has at least one reward
        let branchCounts = [2, 3, 2, 3, 2, 3, 2, 3, 2]

        for stepIndex in 1...9 {
            let count = branchCounts[stepIndex - 1]
            for b in 0..<count {
                // Branch 0 = battle, branch 1 = reward, branch 2 = battle
                let spaceType: SpaceType = (b == 1) ? .reward : .battle
                nodes.append(PathNode(
                    id: UUID(), step: stepIndex, branchIndex: b, spaceType: spaceType
                ))
            }
        }

        // Step 10: Boss
        let bossNode = PathNode(id: UUID(), step: 10, branchIndex: 0, spaceType: .boss)
        nodes.append(bossNode)

        // Wire child connections: every node at step N connects to all nodes at step N+1
        for step in 0..<10 {
            let currentStepNodes = nodes.filter { $0.step == step }
            let nextStepNodeIds = nodes.filter { $0.step == step + 1 }.map { $0.id }
            for node in currentStepNodes {
                if let idx = nodes.firstIndex(where: { $0.id == node.id }) {
                    nodes[idx].childIds = nextStepNodeIds
                }
            }
        }

        return nodes
    }
}
