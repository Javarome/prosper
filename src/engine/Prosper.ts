import {type MemoryParameters, type MemoryState, ProsperMemory} from "./ProsperMemory"
import type {Stimulus} from "./MemoryNode"
import type {NodeFactory} from "./NodeFactory"

export interface ProsperEventMap {
  /** A stimulus has been input. */
  stimulus: CustomEvent<Stimulus>
  /** Predictions computed after a stimulus. */
  prediction: CustomEvent<string[]>
  /** Memory has been cleared. */
  reset: Event
  /** Memory has been loaded from a saved state. */
  load: Event
}

/**
 * Prosper engine facade: feeds stimuli to the memory and notifies listeners of inputs and predictions.
 */
export class Prosper extends EventTarget implements MemoryParameters {
  readonly memory: ProsperMemory

  constructor(memory = new ProsperMemory()) {
    super()
    this.memory = memory
  }

  get minNodeSize() {
    return this.memory.minNodeSize
  }

  set minNodeSize(value: number) {
    this.memory.minNodeSize = value
  }

  get activationGain() {
    return this.memory.activationGain
  }

  set activationGain(value: number) {
    this.memory.activationGain = value
  }

  get deactivationLoss() {
    return this.memory.deactivationLoss
  }

  set deactivationLoss(value: number) {
    this.memory.deactivationLoss = value
  }

  get activatedMin() {
    return this.memory.activatedMin
  }

  set activatedMin(value: number) {
    this.memory.activatedMin = value
  }

  get empty(): boolean {
    return this.memory.graph.order === 0
  }

  input(stimulus: Stimulus, nodeFactory: NodeFactory): string[] {
    this.memory.input(stimulus, nodeFactory)
    this.dispatchEvent(new CustomEvent("stimulus", {detail: stimulus}))
    const predictions = this.memory.predict()
    this.dispatchEvent(new CustomEvent("prediction", {detail: predictions}))
    return predictions
  }

  reset(): void {
    this.memory.reset()
    this.dispatchEvent(new Event("reset"))
  }

  toJSON(): MemoryState {
    return this.memory.toJSON()
  }

  fromJSON(data: MemoryState): void {
    this.memory.fromJSON(data)
    this.dispatchEvent(new Event("load"))
  }

  on<K extends keyof ProsperEventMap>(type: K, listener: (event: ProsperEventMap[K]) => void): () => void {
    const l = listener as EventListener
    this.addEventListener(type, l)
    return () => this.removeEventListener(type, l)
  }
}
