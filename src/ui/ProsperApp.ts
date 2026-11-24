import {Prosper} from "../engine"
import "./ProsperInput"
import "./ProsperOutput"
import "./ProsperGraph"
import type {ProsperInput} from "./ProsperInput"
import type {ProsperOutput} from "./ProsperOutput"
import type {ProsperGraph} from "./ProsperGraph"

const css = `
  :host {
    display: grid;
    grid-template-columns: minmax(18em, 30%) 1fr;
    grid-template-rows: 70vh 1fr;
    grid-template-areas: "input graph" "output output";
    height: 100vh;
  }
  prosper-input { grid-area: input; border-right: 1px solid var(--prosper-border); }
  prosper-graph { grid-area: graph; }
  prosper-output { grid-area: output; border-top: 1px solid var(--prosper-border); }
`

/**
 * Root component: creates a Prosper engine and shares it with input, output and graph views.
 */
export class ProsperApp extends HTMLElement {
  readonly prosper = new Prosper()

  constructor() {
    super()
    const root = this.attachShadow({mode: "open"})
    root.innerHTML = `
      <style>${css}</style>
      <prosper-input></prosper-input>
      <prosper-graph></prosper-graph>
      <prosper-output></prosper-output>
    `
    root.querySelector<ProsperInput>("prosper-input")!.prosper = this.prosper
    root.querySelector<ProsperGraph>("prosper-graph")!.prosper = this.prosper
    root.querySelector<ProsperOutput>("prosper-output")!.prosper = this.prosper
  }
}

customElements.define("prosper-app", ProsperApp)
