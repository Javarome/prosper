import {
  AutoIterator,
  CharNodeFactory,
  type Iterator,
  ManualIterator,
  type MemoryParameters,
  type NodeFactory,
  type Prosper,
  type Stimulus,
  WordNodeFactory
} from "../engine"

interface SampleChoice {
  label: string
  split: (input: string) => string[]
  nodeFactory: NodeFactory
}

const SAMPLE_CHOICES: Record<string, SampleChoice> = {
  chars: {label: "Chars", split: input => input.split(""), nodeFactory: new CharNodeFactory()},
  words: {label: "Words", split: input => input.split(" "), nodeFactory: new WordNodeFactory()}
}

const PARAMETERS: Array<{ key: keyof MemoryParameters, label: string }> = [
  {key: "minNodeSize", label: "Minimum node size"},
  {key: "activationGain", label: "Activation gain"},
  {key: "deactivationLoss", label: "Deactivation loss"},
  {key: "activatedMin", label: "Activated minimum"}
]

const css = `
  :host {
    display: block;
    overflow: auto;
    padding: 1em;
    background: var(--prosper-input-bg, whitesmoke);
  }
  h1 {
    margin-top: 0;
  }
  h1 a {
    color: inherit;
    text-decoration: none;
  }
  fieldset {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.4em 0.6em;
    align-items: center;
    margin-bottom: 1em;
    border: 1px solid #ccc;
    border-radius: 0.3em;
  }
  .row {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em;
  }
  input[type="number"] {
    width: 5em;
  }
  [hidden] {
    display: none !important;
  }
`

/**
 * Lets the user input text in Prosper, choose how it is sampled and iterated, and manage the memory.
 */
export class ProsperInput extends HTMLElement {
  private _prosper?: Prosper
  private iteration?: Iterator
  private unsubscribes: Array<() => void> = []
  private readonly root: ShadowRoot

  constructor() {
    super()
    this.root = this.attachShadow({mode: "open"})
    this.root.innerHTML = `
      <style>${css}</style>
      <h1><a href="https://github.com/Javarome/prosper" target="_blank">Prosper</a></h1>
      <form id="input-form">
        <fieldset>
          <legend>Input</legend>
          <label for="value">Input</label>
          <div class="row"><input id="value" name="value" autocomplete="off" autofocus> <button type="submit">Submit</button></div>
          <label for="sample-type">Sampled as</label>
          <select id="sample-type">
            ${Object.entries(SAMPLE_CHOICES).map(([key, s]) => `<option value="${key}">${s.label}</option>`).join("")}
          </select>
        </fieldset>
        <fieldset>
          <legend>Iteration</legend>
          <label for="iteration-type">Type</label>
          <select id="iteration-type">
            <option value="auto">Automatic</option>
            <option value="manual">Manual</option>
          </select>
          <label for="delay" data-auto>Delay (ms)</label>
          <input id="delay" type="number" min="0" step="50" value="0" data-auto>
          <div class="row" data-manual hidden>
            <button id="next" type="button" title="Click to process next node" disabled>Next</button>
          </div>
        </fieldset>
      </form>
      <fieldset id="memory">
        <legend>Memory</legend>
        ${PARAMETERS.map(p => `
          <label for="${p.key}">${p.label}</label>
          <input id="${p.key}" type="number" step="0.1">`).join("")}
        <div class="row">
          <button id="reset" data-needs-memory>Reset</button>
          <button id="replay" data-needs-memory>Replay</button>
          <button id="save" data-needs-memory>Save</button>
        </div>
        <label for="memory-file">Load</label>
        <input id="memory-file" type="file" accept="application/json,.json">
      </fieldset>
    `
  }

  set prosper(prosper: Prosper) {
    this._prosper = prosper
    if (this.isConnected) {
      this.bind()
    }
  }

  connectedCallback(): void {
    this.wire()
    this.bind()
  }

  disconnectedCallback(): void {
    this.unsubscribes.forEach(unsubscribe => unsubscribe())
    this.unsubscribes = []
    this.iteration?.stop()
  }

  private get sampleChoice(): SampleChoice {
    return SAMPLE_CHOICES[this.select("sample-type").value]
  }

  private get manual(): boolean {
    return this.select("iteration-type").value === "manual"
  }

  private wired = false

  private wire(): void {
    if (this.wired) {
      return
    }
    this.wired = true
    this.elem<HTMLFormElement>("input-form").addEventListener("submit", e => {
      e.preventDefault()
      this.submit()
    })
    this.select("iteration-type").addEventListener("change", () => this.updateIterationType())
    this.elem("next").addEventListener("click", () => {
      this.iteration?.next()
      this.updateState()
    })
    for (const p of PARAMETERS) {
      this.input(p.key).addEventListener("change", e => {
        const value = (e.target as HTMLInputElement).valueAsNumber
        if (this._prosper && !Number.isNaN(value)) {
          this._prosper[p.key] = value
          this.replay()
        }
      })
    }
    this.elem("reset").addEventListener("click", () => this._prosper?.reset())
    this.elem("replay").addEventListener("click", () => this.replay())
    this.elem("save").addEventListener("click", () => this.save())
    this.input("memory-file").addEventListener("change", e => this.load(e.target as HTMLInputElement))
  }

  private bind(): void {
    this.unsubscribes.forEach(unsubscribe => unsubscribe())
    const prosper = this._prosper
    if (!prosper) {
      return
    }
    for (const p of PARAMETERS) {
      this.input(p.key).valueAsNumber = prosper[p.key]
    }
    const update = () => this.updateState()
    this.unsubscribes = [prosper.on("stimulus", update), prosper.on("reset", update), prosper.on("load", update)]
    this.updateState()
  }

  private submit(): void {
    const valueInput = this.input("value")
    const choice = this.sampleChoice
    const sampling = choice.split(valueInput.value).map(s => choice.nodeFactory.create(s))
    this.iterate(sampling)
    valueInput.value = ""
    valueInput.focus()
  }

  private replay(): void {
    const prosper = this._prosper
    if (!prosper || prosper.empty) {
      return
    }
    const factory = this.sampleChoice.nodeFactory
    const inputs = prosper.memory.stimuli().map(id => factory.create(id))
    prosper.reset()
    this.iterate(inputs)
  }

  private iterate(sampling: Array<Stimulus | null>): void {
    const prosper = this._prosper
    if (!prosper) {
      return
    }
    this.iteration?.stop()
    const factory = this.sampleChoice.nodeFactory
    this.iteration = this.manual
      ? new ManualIterator(prosper, factory)
      : new AutoIterator(prosper, factory, this.input("delay").valueAsNumber || 0)
    this.iteration.iterate(sampling)
    this.updateState()
  }

  private save(): void {
    if (!this._prosper) {
      return
    }
    const blob = new Blob([JSON.stringify(this._prosper.toJSON())], {type: "application/json"})
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "prosper-memory.json"
    link.click()
    URL.revokeObjectURL(link.href)
  }

  private async load(fileInput: HTMLInputElement): Promise<void> {
    const file = fileInput.files?.[0]
    if (!file || !this._prosper) {
      return
    }
    try {
      this._prosper.fromJSON(JSON.parse(await file.text()))
    } catch (e) {
      alert(`Could not load ${file.name}: ${e instanceof Error ? e.message : e}`)
    } finally {
      fileInput.value = ""
    }
  }

  private updateIterationType(): void {
    const manual = this.manual
    this.root.querySelectorAll<HTMLElement>("[data-auto]").forEach(el => el.hidden = manual)
    this.root.querySelectorAll<HTMLElement>("[data-manual]").forEach(el => el.hidden = !manual)
    this.updateState()
  }

  private updateState(): void {
    const empty = this._prosper?.empty ?? true
    this.root.querySelectorAll<HTMLButtonElement>("[data-needs-memory]").forEach(b => b.disabled = empty)
    this.elem<HTMLButtonElement>("next").disabled = !(this.iteration instanceof ManualIterator && this.iteration.hasNext)
  }

  private elem<T extends HTMLElement = HTMLElement>(id: string): T {
    return this.root.getElementById(id) as T
  }

  private input(id: string): HTMLInputElement {
    return this.elem<HTMLInputElement>(id)
  }

  private select(id: string): HTMLSelectElement {
    return this.elem<HTMLSelectElement>(id)
  }
}

customElements.define("prosper-input", ProsperInput)
