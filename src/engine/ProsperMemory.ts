import {DirectedGraph} from "graphology"
import type {SerializedGraph} from "graphology-types"
import type {EdgeAttributes, NodeAttributes, Stimulus} from "./MemoryNode"
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
}

export const DEFAULT_PARAMETERS: Readonly<MemoryParameters> = {
  minNodeSize: 0.5,
  activationGain: 0.3,
  deactivationLoss: 0.1,
  activatedMin: 1
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
 */
export class ProsperMemory implements MemoryParameters {
  minNodeSize = DEFAULT_PARAMETERS.minNodeSize
  activationGain = DEFAULT_PARAMETERS.activationGain
  deactivationLoss = DEFAULT_PARAMETERS.deactivationLoss
  activatedMin = DEFAULT_PARAMETERS.activatedMin

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
      this.addEdges(this.latestNodes, node.id)
    } else {
      this.log(`Node ${node.id} already exists`)
      for (const latestId of this.latestNodes) {
        if (this.graph.hasEdge(ProsperMemory.edgeId(latestId, node.id))) {
          this.log(`Edge ${ProsperMemory.edgeId(latestId, node.id)} already exists`)
          const conceptNode = nodeFactory.merge(this.stimulus(latestId), node)
          if (!this.graph.hasNode(conceptNode.id)) {
            this.addNode(conceptNode)
          }
          this.addEdge(node.id, conceptNode.id)
          node = conceptNode
        } else {
          this.addEdges(this.latestNodes, node.id)
        }
      }
    }
    this.activate(node.id)
    this.decay()
    this.log(`latestNodes=${this.nodesString(this.latestNodes)}`)
  }

  /**
   * @return The ids of the nodes that follow the currently active ones.
   */
  predict(): string[] {
    const latest = new Set(this.latestNodes)
    const preds: string[] = []
    this.graph.forEachEdge((_edge, _attrs, source, target) => {
      if (latest.has(source)) {
        preds.push(target)
      }
    })
    return preds
  }

  /**
   * @return The ids of the (non-concept) input nodes, in their creation order.
   */
  stimuli(): string[] {
    return this.graph.filterNodes((_node, attrs) => !attrs.concept)
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
      edges: (data.edges ?? []).map((e, i) => ({
        key: e.id,
        source: e.source,
        target: e.target,
        attributes: {order: i + 1, label: e.label ?? String(i + 1), size: e.size ?? 1}
      }))
    }
  }

  private stimulus(id: string): Stimulus {
    const {label, concept} = this.graph.getNodeAttributes(id)
    return {id, label, concept}
  }

  private activate(id: string): void {
    this.graph.updateNodeAttribute(id, "size", size => (size ?? 1) + this.activationGain)
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

  private addNode(node: Stimulus): void {
    this.log(`Adding node ${node.id}`)
    this.graph.addNode(node.id, {label: node.label, size: 1, concept: node.concept})
  }

  private addEdge(source: string, target: string): void {
    const id = ProsperMemory.edgeId(source, target)
    if (!this.graph.hasEdge(id)) {
      const order = this.graph.size + 1
      this.graph.addEdgeWithKey(id, source, target, {order, label: String(order), size: 1})
    }
  }

  private addEdges(sources: string[], target: string): void {
    this.log(`Adding link from ${this.nodesString(sources)} to ${target}`)
    for (const source of sources) {
      this.addEdge(source, target)
    }
  }

  private nodesString(ids: string[]): string {
    return "[" + ids.map(id => `${id}(${this.graph.getNodeAttribute(id, "size")})`).join(", ") + "]"
  }

  private log(msg: string): void {
    this.logger(`ProsperMemory: ${msg}`)
  }
}
