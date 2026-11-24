/**
 * Attributes of a node (an event or an emerged concept) stored in the memory graph.
 */
export interface NodeAttributes {
  label: string
  /** Activation level. Grows when the node is activated, decays at each new input. */
  size: number
  /** true if the node emerged from the merge of other nodes. */
  concept: boolean
  /** Memory times at which this node was input (or emerged, for a concept). */
  times: number[]
  /** Layout coordinates, set by views (not used by the engine). */
  x?: number
  y?: number
}

export interface EdgeAttributes {
  /** Creation order of this edge in the memory. */
  order: number
  /** Number of times this link has been crossed. The more it is crossed, the easier it is to follow. */
  weight: number
  /** Memory times at which this link has been crossed. */
  times: number[]
}

/**
 * A stimulus to input in memory, as produced by a NodeFactory.
 */
export interface Stimulus {
  id: string
  label: string
  concept: boolean
}

/**
 * A predicted next node, with its relative likelihood.
 */
export interface Prediction {
  id: string
  label: string
  /** Score in ]0, 1], relative to the other predictions (they sum to 1). */
  score: number
}
