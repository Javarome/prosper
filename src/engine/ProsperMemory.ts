import {DirectedGraph} from "graphology"
import type {SerializedGraph} from "graphology-types"
import type {EdgeAttributes, NodeAttributes, Prediction, Stimulus} from "./MemoryNode"
import type {NodeFactory} from "./NodeFactory"

export type MemoryGraph = DirectedGraph<NodeAttributes, EdgeAttributes>
export type MemoryState = SerializedGraph<NodeAttributes, EdgeAttributes>

export interface MemoryParameters {
  /** Activation level under which a node never decays. */
  minNodeSize: number
  /** Activation added to a node when it is input. */
  activationGain: number
  /** Activation lost by every node at each tick (input). */
  deactivationLoss: number
  /** Activation above which a node is considered as currently active ("latest"). */
  activatedMin: number
  /** Ratio of its received activation that a node passes to its neighbors (0 disables spreading). */
  spreadRatio: number
  /** How many links away activation spreads from an input node. */
  spreadDepth: number
}

export const DEFAULT_PARAMETERS: Readonly<MemoryParameters> = {
  minNodeSize: 0.5,
  activationGain: 0.3,
  deactivationLoss: 0.1,
  activatedMin: 1,
  spreadRatio: 0.5,
  spreadDepth: 2
}

/**
 * Legacy memory format, as saved by the sigma v1-based version of Prosper.
 */
interface LegacyState {
  nodes: Array<{ id: string, label?: string, size?: number, concept?: boolean, x?: number, y?: number }>
  edges: Array<{ id: string, source: string, target: string, label?: string, size?: number }>
}

/**
 * A memory as a directed graph of events, where currently active nodes link to the next input ones.
 *
 * Like neurons, the memory has no notion of time: recency only shows through activation levels, which decay at each
 * tick. So the most recently perceived nodes are the most active ones, and the links they create or reinforce are
 * the strongest, whereas older context still links, but more weakly.
 *
 * - Crossing a link again reinforces it, and makes a concept emerge from its two ends.
 * - Activating a node spreads part of its activation to its neighbors, proportionally to the links weights.
 * - Predictions are the successors of active nodes, weighted by the activation of their source and the link weight.
 */
export class ProsperMemory implements MemoryParameters {
  minNodeSize = DEFAULT_PARAMETERS.minNodeSize
  activationGain = DEFAULT_PARAMETERS.activationGain
  deactivationLoss = DEFAULT_PARAMETERS.deactivationLoss
  activatedMin = DEFAULT_PARAMETERS.activatedMin
  spreadRatio = DEFAULT_PARAMETERS.spreadRatio
  spreadDepth = DEFAULT_PARAMETERS.spreadDepth

  /** Ids of the currently active nodes. */
  latestNodes: string[] = []

  readonly graph: MemoryGraph = new DirectedGraph<NodeAttributes, EdgeAttributes>()

  constructor(private readonly logger: (msg: string) => void = () => {
  }) {
  }

  static edgeId(source: string, target: string): string {
    return `${source}-${target}`
  }

  input(stimulus: Stimulus, nodeFactory: NodeFactory): void {
    let node = stimulus
    if (!this.graph.hasNode(node.id)) {
      this.addNode(node)
      for (const latestId of this.latestNodes) {
        this.link(latestId, node.id, this.strength(latestId))
      }
    } else {
      this.log(`Node ${node.id} already exists`)
      for (const latestId of this.latestNodes) {
        const strength = this.strength(latestId)
        const crossed = this.graph.hasEdge(ProsperMemory.edgeId(latestId, node.id))
        this.link(latestId, node.id, strength)
        if (crossed) {
          const conceptNode = nodeFactory.merge(this.stimulus(latestId), node)
          if (!this.graph.hasNode(conceptNode.id)) {
            this.log(`Concept ${conceptNode.id} emerged`)
            this.addNode(conceptNode)
          }
          // The concept emerges as strongly as the context that made it emerge.
          this.link(node.id, conceptNode.id, strength)
          node = conceptNode
        }
      }
    }
    // The perceived stimulus is active, and so is the concept that may have emerged from it.
    this.perceive(stimulus.id)
    if (node.id !== stimulus.id) {
      this.perceive(node.id)
    }
    this.decay()
    this.log(`latestNodes=${this.nodesString(this.latestNodes)}`)
  }

  /**
   * @return The successors of the currently active nodes, most likely first.
   */
  predict(): Prediction[] {
    const scores = new Map<string, number>()
    for (const source of this.latestNodes) {
      const activation = this.strength(source)
      const outWeight = this.outWeight(source)
      this.graph.forEachOutEdge(source, (_edge, attrs, _source, target) => {
        scores.set(target, (scores.get(target) ?? 0) + activation * attrs.weight / outWeight)
      })
    }
    const total = [...scores.values()].reduce((sum, score) => sum + score, 0)
    return [...scores.entries()]
      .map(([id, score]) => ({id, label: this.graph.getNodeAttribute(id, "label"), score: score / total}))
      .sort((a, b) => b.score - a.score)
  }

  reset(): void {
    this.graph.clear()
    this.latestNodes = []
  }

  toJSON(): MemoryState {
    return this.graph.export()
  }

  fromJSON(data: MemoryState | LegacyState): void {
    this.reset()
    this.graph.import(ProsperMemory.isLegacy(data) ? ProsperMemory.fromLegacy(data) : data)
    // Keep only known attributes (older saves had edge creation orders, labels or times).
    this.graph.updateEachNodeAttributes((_node, attrs) => ({
      label: attrs.label, size: attrs.size ?? 1, concept: Boolean(attrs.concept), x: attrs.x, y: attrs.y
    }))
    this.graph.updateEachEdgeAttributes((_edge, attrs) => ({weight: attrs.weight ?? 1}))
    this.latestNodes = this.graph.filterNodes((_node, attrs) => attrs.size > this.activatedMin)
  }

  private static isLegacy(data: MemoryState | LegacyState): data is LegacyState {
    const firstNode = data.nodes?.[0]
    return Boolean(firstNode) && "id" in firstNode && !("key" in firstNode)
  }

  private static fromLegacy(data: LegacyState): MemoryState {
    return {
      options: {type: "directed", multi: false, allowSelfLoops: true},
      attributes: {},
      nodes: data.nodes.map(n => ({
        key: n.id,
        attributes: {label: n.label ?? n.id, size: n.size ?? 1, concept: Boolean(n.concept), x: n.x, y: n.y}
      })),
      edges: (data.edges ?? []).map(e => ({key: e.id, source: e.source, target: e.target, attributes: {weight: 1}}))
    }
  }

  private stimulus(id: string): Stimulus {
    const {label, concept} = this.graph.getNodeAttributes(id)
    return {id, label, concept}
  }

  /**
   * How much a node is active above the activity threshold. As activation decays at each tick, this is also how
   * recent the node is.
   */
  private strength(id: string): number {
    return Math.max(this.graph.getNodeAttribute(id, "size") - this.activatedMin, 0)
  }

  /**
   * Activates a perceived node: whatever its residual activation, a perceived node is at least at the activity
   * threshold, plus the activation gain (which spreads to its neighbors).
   */
  private perceive(id: string): void {
    this.graph.updateNodeAttribute(id, "size", size => Math.max(size ?? 1, this.activatedMin))
    this.activate(id, this.activationGain)
  }

  /**
   * Adds activation to a node, and spreads part of it to its neighbors, proportionally to the links weights.
   */
  private activate(id: string, amount: number): void {
    let wave = new Map<string, number>([[id, amount]])
    const reached = new Set<string>()
    for (let depth = 0; depth <= this.spreadDepth && wave.size > 0; depth++) {
      const next = new Map<string, number>()
      for (const [nodeId, received] of wave) {
        this.graph.updateNodeAttribute(nodeId, "size", size => (size ?? 1) + received)
        reached.add(nodeId)
        const spread = received * this.spreadRatio
        const weight = this.totalWeight(nodeId)
        if (spread <= 0 || weight <= 0) {
          continue
        }
        this.graph.forEachEdge(nodeId, (_edge, attrs, source, target) => {
          const neighbor = source === nodeId ? target : source
          if (!reached.has(neighbor) && !wave.has(neighbor)) {
            next.set(neighbor, (next.get(neighbor) ?? 0) + spread * attrs.weight / weight)
          }
        })
      }
      wave = next
    }
    this.log(`nodes after activation of ${id}=${this.nodesString(this.graph.nodes())}`)
  }

  /**
   * A tick: every node loses some activation.
   */
  private decay(): void {
    this.latestNodes = []
    this.graph.forEachNode((id, attrs) => {
      const size = Math.max(attrs.size - this.deactivationLoss, this.minNodeSize)
      this.graph.setNodeAttribute(id, "size", size)
      if (size > this.activatedMin) {
        this.latestNodes.push(id)
      }
    })
  }

  private outWeight(id: string): number {
    return this.graph.reduceOutEdges(id, (sum, _edge, attrs) => sum + attrs.weight, 0)
  }

  private totalWeight(id: string): number {
    return this.graph.reduceEdges(id, (sum, _edge, attrs) => sum + attrs.weight, 0)
  }

  private addNode(node: Stimulus): void {
    this.log(`Adding node ${node.id}`)
    this.graph.addNode(node.id, {label: node.label, size: 1, concept: node.concept})
  }

  /**
   * Creates a link, or reinforces it if it already exists, by the given strength.
   */
  private link(source: string, target: string, strength: number): void {
    if (strength <= 0) {
      return
    }
    const id = ProsperMemory.edgeId(source, target)
    if (this.graph.hasEdge(id)) {
      this.graph.updateEdgeAttribute(id, "weight", weight => (weight ?? 0) + strength)
    } else {
      this.graph.addEdgeWithKey(id, source, target, {weight: strength})
    }
  }

  private nodesString(ids: string[]): string {
    return "[" + ids.map(id => `${id}(${this.graph.getNodeAttribute(id, "size").toFixed(2)})`).join(", ") + "]"
  }

  private log(msg: string): void {
    this.logger(`ProsperMemory: ${msg}`)
  }
}
