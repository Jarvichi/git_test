import { PathNode, SpaceType } from './types'

let nodeId = 0
function uid(): string {
  return `node-${++nodeId}`
}

export function generatePath(): PathNode[] {
  nodeId = 0
  const nodes: PathNode[] = []

  // Step 0: Start
  const startNode: PathNode = {
    id: uid(), step: 0, branchIndex: 0,
    spaceType: 'start', isVisited: false, childIds: [],
  }
  nodes.push(startNode)

  // Steps 1-9: alternating 2/3 branches
  const branchCounts = [2, 3, 2, 3, 2, 3, 2, 3, 2]

  for (let step = 1; step <= 9; step++) {
    const count = branchCounts[step - 1]
    for (let b = 0; b < count; b++) {
      // Branch 0 = battle, branch 1 = reward, branch 2 = battle
      const spaceType: SpaceType = b === 1 ? 'reward' : 'battle'
      nodes.push({
        id: uid(), step, branchIndex: b,
        spaceType, isVisited: false, childIds: [],
      })
    }
  }

  // Step 10: Boss
  nodes.push({
    id: uid(), step: 10, branchIndex: 0,
    spaceType: 'boss', isVisited: false, childIds: [],
  })

  // Wire children: every node at step N → all nodes at step N+1
  for (let step = 0; step < 10; step++) {
    const currentStepNodes = nodes.filter(n => n.step === step)
    const nextStepIds = nodes.filter(n => n.step === step + 1).map(n => n.id)
    for (const node of currentStepNodes) {
      node.childIds = nextStepIds
    }
  }

  return nodes
}
