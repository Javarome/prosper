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
  /** Creation order of this edge in the memory. */
  order: number
  label: string
  size: number
}

/**
 * A stimulus to input in memory, as produced by a NodeFactory.
 */
export interface Stimulus {
  id: string
  label: string
  concept: boolean
}
