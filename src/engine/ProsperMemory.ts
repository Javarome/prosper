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
  /** Activation lost by every node at each input. */
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
 * - Each input occurs at a memory time, recorded on the input node and on the links crossed to reach it.
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

  /** Current memory time, incremented at each input. */
  time = 0

  readonly graph: MemoryGraph = new DirectedGraph<NodeAttributes, EdgeAttributes>()

  constructor(private readonly logger: (msg: string) => void = () => {
  }) {
  }

  static edgeId(source: string, target: string): string {
    return `${source}-${target}`
  }

  input(stimulus: Stimulus, nodeFactory: NodeFactory): void {
    const t = ++this.time
    let node = stimulus
    if (!this.graph.hasNode(node.id)) {
      this.addNode(node, t)
      for (const latestId of this.latestNodes) {
        this.link(latestId, node.id, t)
      }
    } else {
      this.log(`Node ${node.id} already exists`)
      this.graph.updateNodeAttribute(node.id, "times", times => [...(times ?? []), t])
      for (const latestId of this.latestNodes) {
        const crossed = this.graph.hasEdge(ProsperMemory.edgeId(latestId, node.id))
        this.link(latestId, node.id, t)
        if (crossed) {
          const conceptNode = nodeFactory.merge(this.stimulus(latestId), node)
          if (!this.graph.hasNode(conceptNode.id)) {
            this.log(`Concept ${conceptNode.id} emerged`)
            this.addNode(conceptNode, t)
          } else {
            this.graph.updateNodeAttribute(conceptNode.id, "times", times => [...(times ?? []), t])
          }
          this.link(node.id, conceptNode.id, t)
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
    this.log(`t=${t} latestNodes=${this.nodesString(this.latestNodes)}`)
  }

  /**
   * @return The successors of the currently active nodes, most likely first.
   */
  predict(): Prediction[] {
    const scores = new Map<string, number>()
    for (const source of this.latestNodes) {
      const activation = this.graph.getNodeAttribute(source, "size") - this.activatedMin
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

  /**
   * @return The ids of the (non-concept) input nodes, in the order they were input.
   */
  stimuli(): string[] {
    const occurrences: Array<[number, string]> = []
    this.graph.forEachNode((id, attrs) => {
      if (!attrs.concept) {
        attrs.times.forEach(t => occurrences.push([t, id]))
      }
    })
    if (occurrences.length === 0) {  // No times (legacy memory): use creation order
      return this.graph.filterNodes((_node, attrs) => !attrs.concept)
    }
    return occurrences.sort((a, b) => a[0] - b[0]).map(([, id]) => id)
  }

  reset(): void {
    this.graph.clear()
    this.latestNodes = []
    this.time = 0
  }

  toJSON(): MemoryState {
    return this.graph.export()
  }

  fromJSON(data: MemoryState | LegacyState): void {
    this.reset()
    this.graph.import(ProsperMemory.isLegacy(data) ? ProsperMemory.fromLegacy(data) : data)
    this.graph.updateEachNodeAttributes((_node, attrs) => ({...attrs, times: attrs.times ?? []}))
    this.graph.updateEachEdgeAttributes((_edge, attrs) => ({
      ...attrs,
      weight: attrs.weight ?? 1,
      times: attrs.times ?? []
    }))
    this.graph.forEachNode((_node, attrs) => this.time = Math.max(this.time, ...attrs.times))
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
        attributes: {label: n.label ?? n.id, size: n.size ?? 1, concept: Boolean(n.concept), times: [], x: n.x, y: n.y}
      })),
      edges: (data.edges ?? []).map((e, i) => ({
        key: e.id,
        source: e.source,
        target: e.target,
        attributes: {order: i + 1, weight: 1, times: []}
      }))
    }
  }

  private stimulus(id: string): Stimulus {
    const {label, concept} = this.graph.getNodeAttributes(id)
    return {id, label, concept}
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

  private addNode(node: Stimulus, t: number): void {
    this.log(`Adding node ${node.id}`)
    this.graph.addNode(node.id, {label: node.label, size: 1, concept: node.concept, times: [t]})
  }

  /**
   * Creates a link, or reinforces it if it already exists.
   */
  private link(source: string, target: string, t: number): void {
    const id = ProsperMemory.edgeId(source, target)
    if (this.graph.hasEdge(id)) {
      this.graph.updateEdgeAttributes(id, attrs => ({...attrs, weight: attrs.weight + 1, times: [...attrs.times, t]}))
    } else {
      this.graph.addEdgeWithKey(id, source, target, {order: this.graph.size + 1, weight: 1, times: [t]})
    }
  }

  private nodesString(ids: string[]): string {
    return "[" + ids.map(id => `${id}(${this.graph.getNodeAttribute(id, "size").toFixed(2)})`).join(", ") + "]"
  }

  private log(msg: string): void {
    this.logger(`ProsperMemory: ${msg}`)
  }
}
