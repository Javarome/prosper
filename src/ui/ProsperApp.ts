import {Prosper} from "../engine"
import "./ProsperInput"
import "./ProsperOutput"
import "./ProsperGraph"
import type {ProsperInput} from "./ProsperInput"
import type {ProsperOutput} from "./ProsperOutput"
import type {ProsperGraph} from "./ProsperGraph"

const SPLITTER_SIZE = 6
/** Minimum size of a panel, in pixels. */
const MIN_PANEL = 120
/** Keyboard move of a splitter, in pixels. */
const KEY_STEP = 20
const STORAGE_KEY = "prosper.layout"

const css = `
  :host {
    --input-width: 30vw;
    --top-height: 70vh;
    display: grid;
    grid-template-columns: var(--input-width) ${SPLITTER_SIZE}px 1fr;
    grid-template-rows: var(--top-height) ${SPLITTER_SIZE}px 1fr;
    grid-template-areas:
      "input vsplit graph"
      "hsplit hsplit hsplit"
      "output output output";
    height: 100vh;
    overflow: hidden;
  }
  prosper-input { grid-area: input; min-width: 0; }
  prosper-graph { grid-area: graph; min-width: 0; }
  prosper-output { grid-area: output; min-height: 0; }
  .splitter {
    background: var(--prosper-border);
    touch-action: none;
    outline: none;
  }
  .splitter:hover, .splitter:focus-visible, .splitter.dragging {
    background: var(--prosper-node);
  }
  .vertical { grid-area: vsplit; cursor: col-resize; }
  .horizontal { grid-area: hsplit; cursor: row-resize; }
  :host(.resizing) {
    user-select: none;
  }
`

interface Layout {
  inputWidth?: number
  topHeight?: number
}

/**
 * Root component: creates a Prosper engine and shares it with input, output and graph views, laid out in panels
 * that can be resized by dragging the splitters between them.
 */
export class ProsperApp extends HTMLElement {
  readonly prosper = new Prosper()
  private layout: Layout = {}
  private readonly onWindowResize = () => this.applyLayout()

  constructor() {
    super()
    const root = this.attachShadow({mode: "open"})
    root.innerHTML = `
      <style>${css}</style>
      <prosper-input></prosper-input>
      <div class="splitter vertical" role="separator" aria-orientation="vertical" aria-label="Resize input panel"
           tabindex="0"></div>
      <prosper-graph></prosper-graph>
      <div class="splitter horizontal" role="separator" aria-orientation="horizontal" aria-label="Resize chat panel"
           tabindex="0"></div>
      <prosper-output></prosper-output>
    `
    root.querySelector<ProsperInput>("prosper-input")!.prosper = this.prosper
    root.querySelector<ProsperGraph>("prosper-graph")!.prosper = this.prosper
    root.querySelector<ProsperOutput>("prosper-output")!.prosper = this.prosper
    this.initSplitter(root.querySelector(".vertical")!, "inputWidth")
    this.initSplitter(root.querySelector(".horizontal")!, "topHeight")
  }

  connectedCallback(): void {
    try {
      this.layout = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
    } catch {
      this.layout = {}
    }
    this.applyLayout()
    addEventListener("resize", this.onWindowResize)
  }

  disconnectedCallback(): void {
    removeEventListener("resize", this.onWindowResize)
  }

  private initSplitter(splitter: HTMLElement, key: keyof Layout): void {
    const horizontal = key === "topHeight"
    const current = () => {
      const rect = (horizontal ? this.shadowRoot!.querySelector("prosper-graph") : this.shadowRoot!.querySelector("prosper-input"))!
        .getBoundingClientRect()
      return horizontal ? rect.height : rect.width
    }
    const set = (size: number) => {
      this.layout[key] = size
      this.applyLayout()
    }
    splitter.addEventListener("pointerdown", down => {
      down.preventDefault()
      splitter.setPointerCapture(down.pointerId)
      splitter.classList.add("dragging")
      this.classList.add("resizing")
      const start = horizontal ? down.clientY : down.clientX
      const startSize = current()
      const move = (e: PointerEvent) => set(startSize + (horizontal ? e.clientY : e.clientX) - start)
      const up = () => {
        splitter.removeEventListener("pointermove", move)
        splitter.classList.remove("dragging")
        this.classList.remove("resizing")
        this.saveLayout()
      }
      splitter.addEventListener("pointermove", move)
      splitter.addEventListener("pointerup", up, {once: true})
      splitter.addEventListener("pointercancel", up, {once: true})
    })
    splitter.addEventListener("keydown", e => {
      const delta = {ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1}[e.key]
      if (delta) {
        e.preventDefault()
        set(current() + delta * KEY_STEP)
        this.saveLayout()
      }
    })
    splitter.addEventListener("dblclick", () => {
      delete this.layout[key]
      this.applyLayout()
      this.saveLayout()
    })
  }

  private applyLayout(): void {
    const max = (total: number) => Math.max(total - SPLITTER_SIZE - MIN_PANEL, MIN_PANEL)
    const clamp = (size: number, total: number) => Math.min(Math.max(size, MIN_PANEL), max(total))
    const {inputWidth, topHeight} = this.layout
    if (inputWidth !== undefined) {
      this.style.setProperty("--input-width", `${clamp(inputWidth, this.clientWidth || innerWidth)}px`)
    } else {
      this.style.removeProperty("--input-width")
    }
    if (topHeight !== undefined) {
      this.style.setProperty("--top-height", `${clamp(topHeight, this.clientHeight || innerHeight)}px`)
    } else {
      this.style.removeProperty("--top-height")
    }
  }

  private saveLayout(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.layout))
  }
}

customElements.define("prosper-app", ProsperApp)
