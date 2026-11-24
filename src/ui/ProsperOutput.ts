import type {Prediction, Prosper} from "../engine"

const css = `
  :host {
    display: block;
    overflow: auto;
    padding: 0.5em 1em;
    background: var(--prosper-output-bg);
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
    color: var(--prosper-question-fg);
    background: var(--prosper-question-bg);
  }
  .answer {
    float: left;
    color: var(--prosper-answer-fg);
    background: var(--prosper-answer-bg);
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
    // A human-like answer: only the most likely prediction.
    const answer = predictions[0]?.label
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
