/**
 * Attributes of a node (an event or an emerged concept) stored in the memory graph.
 */
export interface NodeAttributes {
  label: string
  /** Activation level. Grows when the node is activated, decays at each new input. */
  size: number
  /** true if the node emerged from the merge of other nodes. */
  concept: boolean
  /** Layout coordinates, set by views (not used by the engine). */
  x?: number
  y?: number
}

export interface EdgeAttributes {
  /**
   * How easy this link is to follow. Each crossing adds the activation of its source at that moment, so links from
   * recent (more active) nodes are reinforced more than links from older context.
   */
  weight: number
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
