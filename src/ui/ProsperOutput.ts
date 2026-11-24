import type {Prediction, Prosper} from "../engine"

/** Maximum number of predictions displayed after each input. */
const MAX_PREDICTIONS = 3

const css = `
  :host {
    display: block;
    overflow: auto;
    padding: 0.5em 1em;
    background: var(--prosper-output-bg, #fafafa);
  }
  .bubble {
    clear: both;
    max-width: 70%;
    padding: 0.4em 0.7em;
    border-radius: 0.8em;
    margin-top: 0.3em;
    white-space: pre-wrap;
  }
  .question {
    float: right;
    color: white;
    background: rgb(60, 200, 60);
  }
  .answer {
    float: left;
    background: lightgray;
  }
`

/**
 * Displays, as a chat, each stimulus input and the predictions that followed it.
 */
export class ProsperOutput extends HTMLElement {
  private _prosper?: Prosper
  private unsubscribes: Array<() => void> = []
  private latestInput: string[] = []
  private readonly list: HTMLElement

  constructor() {
    super()
    const root = this.attachShadow({mode: "open"})
    root.innerHTML = `<style>${css}</style><output></output>`
    this.list = root.querySelector("output")!
  }

  set prosper(prosper: Prosper) {
    this._prosper = prosper
    if (this.isConnected) {
      this.subscribe()
    }
  }

  connectedCallback(): void {
    this.subscribe()
  }

  disconnectedCallback(): void {
    this.unsubscribe()
  }

  reset(): void {
    this.list.replaceChildren()
    this.latestInput = []
  }

  private subscribe(): void {
    this.unsubscribe()
    const prosper = this._prosper
    if (!prosper) {
      return
    }
    this.unsubscribes.push(
      prosper.on("stimulus", e => this.latestInput.push(e.detail.label)),
      prosper.on("prediction", e => this.output(e.detail)),
      prosper.on("reset", () => this.reset())
    )
  }

  private unsubscribe(): void {
    this.unsubscribes.forEach(unsubscribe => unsubscribe())
    this.unsubscribes = []
  }

  private output(predictions: Prediction[]): void {
    const answer = predictions.slice(0, MAX_PREDICTIONS)
      .map(p => `${p.label} (${Math.round(p.score * 100)}%)`)
      .join(", ")
    this.list.append(
      this.bubble("question", this.latestInput.join(" ")),
      this.bubble("answer", answer || "...")
    )
    this.latestInput = []
    this.scrollTop = this.scrollHeight
  }

  private bubble(className: string, text: string): HTMLElement {
    const elem = document.createElement("div")
    elem.classList.add("bubble", className)
    elem.textContent = text
    return elem
  }
}

customElements.define("prosper-output", ProsperOutput)
