import { PathNode, SpaceType } from './types'

let nodeId = 0
function uid(): string {
  return `node-${++nodeId}`
}

/*
 * Binary-tree path with diamond shape: expand steps 0-3, hold steps 4-5,
 * converge steps 6-10. Each node connects to exactly 2 children (binary choice).
 *
 * Step  0: 1 node  (start)
 * Step  1: 2 nodes
 * Step  2: 3 nodes
 * Step  3: 4 nodes  (widest)
 * Step  4: 4 nodes
 * Step  5: 3 nodes
 * Step  6: 3 nodes
 * Step  7: 2 nodes
 * Step  8: 2 nodes
 * Step  9: 2 nodes
 * Step 10: 1 node  (boss)
 */

// Node counts per step
const STEP_COUNTS = [1, 2, 3, 4, 4, 3, 3, 2, 2, 2, 1]

// Space types per step (indexed by branchIndex within step)
const STEP_TYPES: SpaceType[][] = [
  ['start'],                              // Step 0
  ['battle', 'battle'],                   // Step 1
  ['battle', 'reward', 'battle'],         // Step 2
  ['battle', 'battle', 'reward', 'battle'], // Step 3
  ['battle', 'reward', 'battle', 'battle'], // Step 4
  ['battle', 'battle', 'battle'],         // Step 5
  ['reward', 'battle', 'battle'],         // Step 6
  ['battle', 'battle'],                   // Step 7
  ['battle', 'reward'],                   // Step 8
  ['battle', 'battle'],                   // Step 9
  ['boss'],                               // Step 10
]

// Adjacency: for each step, maps [parentBranchIndex] → [childBranchIndex, childBranchIndex]
// Each parent connects to exactly 2 children in the next step.
const WIRING: number[][][] = [
  // Step 0 → Step 1:  1 node → 2 nodes
  [[0, 1]],
  // Step 1 → Step 2:  2 nodes → 3 nodes
  [[0, 1], [1, 2]],
  // Step 2 → Step 3:  3 nodes → 4 nodes
  [[0, 1], [1, 2], [2, 3]],
  // Step 3 → Step 4:  4 nodes → 4 nodes  (edges → 1 child)
  [[0], [1, 2], [2, 3], [3]],
  // Step 4 → Step 5:  4 nodes → 3 nodes  (converging, edges → 1 child)
  [[0], [0, 1], [1, 2], [2]],
  // Step 5 → Step 6:  3 nodes → 3 nodes  (edges → 1 child)
  [[0], [1, 2], [2]],
  // Step 6 → Step 7:  3 nodes → 2 nodes  (converging, edges → 1 child)
  [[0], [0, 1], [1]],
  // Step 7 → Step 8:  2 nodes → 2 nodes  (parallel tracks)
  [[0], [1]],
  // Step 8 → Step 9:  2 nodes → 2 nodes  (parallel tracks)
  [[0], [1]],
  // Step 9 → Step 10: 2 nodes → 1 node   (converging to boss)
  [[0], [0]],
]

export function generatePath(): PathNode[] {
  nodeId = 0
  const nodes: PathNode[] = []

  // Create all nodes
  for (let step = 0; step <= 10; step++) {
    const count = STEP_COUNTS[step]
    const types = STEP_TYPES[step]
    for (let b = 0; b < count; b++) {
      nodes.push({
        id: uid(),
        step,
        branchIndex: b,
        spaceType: types[b],
        isVisited: false,
        childIds: [],
      })
    }
  }

  // Wire children using the adjacency table
  for (let step = 0; step < 10; step++) {
    const parentsAtStep = nodes.filter(n => n.step === step)
    const childrenAtNextStep = nodes.filter(n => n.step === step + 1)
    const wiring = WIRING[step]

    for (let pi = 0; pi < parentsAtStep.length; pi++) {
      const parent = parentsAtStep[pi]
      const childIndices = wiring[pi]
      // Deduplicate child IDs (in case both indices point to same node)
      const childIdSet = new Set<string>()
      for (const ci of childIndices) {
        childIdSet.add(childrenAtNextStep[ci].id)
      }
      parent.childIds = [...childIdSet]
    }
  }

  return nodes
}
