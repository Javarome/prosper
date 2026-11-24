import Sigma, {DEFAULT_STYLES} from "sigma"
import {extremityArrow, layerPlain, pathCurved, pathLine, pathLoop} from "sigma/rendering"
import FA2Layout from "graphology-layout-forceatlas2/worker"
import type {NodeAttributes, Prosper} from "../engine"

const css = `
  :host {
    display: block;
    position: relative;
    background: var(--prosper-graph-bg, white);
  }
  .sigma {
    position: absolute;
    inset: 0;
  }
`

/**
 * Displays the Prosper memory graph, using sigma.js and a ForceAtlas2 layout.
 */
export class ProsperGraph extends HTMLElement {
  private _prosper?: Prosper
  private sigma?: { kill(): void }
  private layout?: FA2Layout
  private layoutTimer?: ReturnType<typeof setTimeout>
  private unsubscribes: Array<() => void> = []

  constructor() {
    super()
    const root = this.attachShadow({mode: "open"})
    root.innerHTML = `<style>${css}</style><div class="sigma"></div>`
  }

  set prosper(prosper: Prosper) {
    this._prosper = prosper
    if (this.isConnected) {
      this.init()
    }
  }

  connectedCallback(): void {
    if (this._prosper && !this.sigma) {
      this.init()
    }
  }

  disconnectedCallback(): void {
    this.dispose()
  }

  /**
   * Restarts the layout for a while, so that the graph rearranges itself.
   */
  refresh(): void {
    if (!this.layout || !this._prosper) {
      return
    }
    clearTimeout(this.layoutTimer)
    if (!this.layout.isRunning()) {
      this.layout.start()
    }
    const delay = Math.max(this._prosper.memory.graph.order * 60, 300)
    this.layoutTimer = setTimeout(() => this.layout?.stop(), delay)
  }

  private init(): void {
    this.dispose()
    const prosper = this._prosper!
    const graph = prosper.memory.graph
    const container = this.shadowRoot!.querySelector<HTMLElement>(".sigma")!

    const placeNode = (node: string, attrs: NodeAttributes) => {
      if (attrs.x === undefined || attrs.y === undefined) {
        graph.mergeNodeAttributes(node, {x: Math.random(), y: Math.random()})
      }
    }
    graph.forEachNode(placeNode)
    const onNodeAdded = ({key, attributes}: { key: string, attributes: NodeAttributes }) => placeNode(key, attributes)
    graph.on("nodeAdded", onNodeAdded)
    this.unsubscribes.push(() => graph.off("nodeAdded", onNodeAdded))

    this.sigma = new Sigma(graph, container, {
      primitives: {
        edges: {
          paths: [pathLine(), pathCurved(), pathLoop()],
          extremities: [extremityArrow()],
          layers: [layerPlain()],
          defaultHead: "arrow"
        }
      },
      styles: {
        nodes: [DEFAULT_STYLES.nodes, {
          size: (attrs) => Math.min(4 + ((attrs.size as number ?? 1) - 0.5) * 8, 24),
          color: {whenData: {concept: true}, then: "#3cb371", else: "steelblue"},
          labelVisibility: "visible"
        }],
        edges: [DEFAULT_STYLES.edges, {
          color: {whenState: "isHovered", then: "red", else: "lightblue"},
          size: 2,
          head: "arrow",
          path: "straight",
          parallelPath: "curved",
          selfLoopPath: "loop",
          labelColor: "gray",
          labelVisibility: "visible"
        }]
      },
      settings: {
        itemSizesReference: "screen",
        renderEdgeLabels: true,
        enableEdgeEvents: true,
        allowInvalidContainer: true
      }
    })

    this.layout = new FA2Layout(graph, {settings: {gravity: 3, scalingRatio: 30, barnesHutOptimize: false}})

    this.unsubscribes.push(
      prosper.on("stimulus", () => this.refresh()),
      prosper.on("load", () => {
        graph.forEachNode(placeNode)
        this.refresh()
      })
    )
  }

  private dispose(): void {
    clearTimeout(this.layoutTimer)
    this.unsubscribes.forEach(unsubscribe => unsubscribe())
    this.unsubscribes = []
    this.layout?.kill()
    this.layout = undefined
    this.sigma?.kill()
    this.sigma = undefined
  }
}

customElements.define("prosper-graph", ProsperGraph)
