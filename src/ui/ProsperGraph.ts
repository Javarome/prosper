import Sigma, {DEFAULT_STYLES} from "sigma"
import {extremityArrow, layerPlain, pathCurved, pathLine, pathLoop} from "sigma/rendering"
import FA2Layout from "graphology-layout-forceatlas2/worker"
import type {NodeAttributes, Prosper} from "../engine"

const css = `
  :host {
    display: block;
    position: relative;
    background: var(--prosper-graph-bg);
  }
  .sigma {
    position: absolute;
    inset: 0;
  }
  .probe {
    display: none;
  }
`

/** Graph colors, as CSS custom properties (see theme.css). */
const THEME_VARIABLES = {
  node: "--prosper-node",
  concept: "--prosper-concept",
  edge: "--prosper-edge",
  edgeHover: "--prosper-edge-hover",
  label: "--prosper-label",
  edgeLabel: "--prosper-edge-label",
  labelBackdrop: "--prosper-label-backdrop"
} as const

type Theme = Record<keyof typeof THEME_VARIABLES, string>

/**
 * Displays the Prosper memory graph, using sigma.js and a ForceAtlas2 layout.
 */
export class ProsperGraph extends HTMLElement {
  private _prosper?: Prosper
  private sigma?: { kill(): void, refresh(): void, resize(force?: boolean): unknown }
  /** Keeps the renderer sized to the panel when it is resized. */
  private readonly resizeObserver = new ResizeObserver(() => {
    this.sigma?.resize(true)
    this.sigma?.refresh()
  })
  /** Current graph colors, resolved from the CSS theme for the WebGL renderer. */
  private theme: Theme = {
    node: "steelblue", concept: "#3cb371", edge: "lightblue", edgeHover: "red",
    label: "black", edgeLabel: "gray", labelBackdrop: "white"
  }
  private readonly colorScheme = matchMedia("(prefers-color-scheme: dark)")
  private readonly onColorSchemeChange = () => {
    this.readTheme()
    this.sigma?.refresh()
  }
  private layout?: FA2Layout
  private layoutTimer?: ReturnType<typeof setTimeout>
  private unsubscribes: Array<() => void> = []

  constructor() {
    super()
    const root = this.attachShadow({mode: "open"})
    root.innerHTML = `<style>${css}</style><div class="sigma"></div><span class="probe"></span>`
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

  /**
   * Resolves the theme colors. Custom properties holding light-dark() are not resolved when read directly, so they
   * are applied to a probe element, whose computed color is resolved for the current color scheme.
   */
  private readTheme(): void {
    const probe = this.shadowRoot!.querySelector<HTMLElement>(".probe")!
    for (const [key, variable] of Object.entries(THEME_VARIABLES) as Array<[keyof Theme, string]>) {
      probe.style.color = `var(${variable})`
      const color = getComputedStyle(probe).color
      if (color) {
        this.theme[key] = color
      }
    }
  }

  private init(): void {
    this.dispose()
    this.readTheme()
    this.colorScheme.addEventListener("change", this.onColorSchemeChange)
    const theme = this.theme
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
          color: (attrs) => attrs.concept ? theme.concept : theme.node,
          labelColor: () => theme.label,
          backdropColor: () => theme.labelBackdrop,
          labelVisibility: "visible"
        }],
        edges: [DEFAULT_STYLES.edges, {
          color: (_attrs, state) => state.isHovered ? theme.edgeHover : theme.edge,
          // The link weight shows as its thickness; its value only when hovered.
          // At least 1px, so that arrows (5 times the thickness) stay visible.
          size: (attrs) => Math.min(1 + (attrs.weight as number ?? 1) * 5, 5),
          label: (attrs) => (attrs.weight as number ?? 0).toFixed(2),
          head: "arrow",
          path: "straight",
          parallelPath: "curved",
          selfLoopPath: "loop",
          labelColor: () => theme.edgeLabel,
          labelVisibility: {whenState: "isHovered", then: "visible", else: "hidden"}
        }]
      },
      settings: {
        itemSizesReference: "screen",
        renderEdgeLabels: true,
        enableEdgeEvents: true,
        allowInvalidContainer: true
      }
    })

    this.resizeObserver.observe(this)
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
    this.resizeObserver.disconnect()
    this.colorScheme.removeEventListener("change", this.onColorSchemeChange)
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
