import type {Prosper} from "./Prosper"
import type {NodeFactory} from "./NodeFactory"
import type {Stimulus} from "./MemoryNode"

/**
 * Feeds a sampling of stimuli to Prosper.
 */
export interface Iterator {
  readonly hasNext: boolean

  iterate(sampling: Array<Stimulus | null>): void

  next(): void

  stop(): void
}

/**
 * Inputs all stimuli, one every `delay` milliseconds.
 */
export class AutoIterator implements Iterator {
  private timers: ReturnType<typeof setTimeout>[] = []
  private remaining = 0
  private started = false
  private onDone: Array<() => void> = []

  constructor(private readonly prosper: Prosper, private readonly nodeFactory: NodeFactory,
              private readonly delay = 0) {
  }

  /** true while stimuli remain to be input (including before iterate() was called). */
  get hasNext(): boolean {
    return !this.started || this.remaining > 0
  }

  iterate(sampling: Array<Stimulus | null>): void {
    this.timers.forEach(clearTimeout)
    this.started = true
    const inputs = sampling.filter((s): s is Stimulus => Boolean(s))
    this.remaining = inputs.length
    if (!inputs.length) {
      this.done()
    }
    this.timers = inputs.map((input, i) => setTimeout(() => {
      this.remaining--
      this.prosper.input(input, this.nodeFactory)
      if (this.remaining === 0) {
        this.done()
      }
    }, this.delay * i))
  }

  /**
   * Runs a callback once all stimuli have been input (immediately if already done).
   */
  then(callback: () => void): void {
    if (this.started && this.remaining === 0) {
      callback()
    } else {
      this.onDone.push(callback)
    }
  }

  next(): void {
  }

  stop(): void {
    this.timers.forEach(clearTimeout)
    this.timers = []
    this.remaining = 0
    this.started = true
    this.onDone = []
  }

  private done(): void {
    const callbacks = this.onDone
    this.onDone = []
    callbacks.forEach(callback => callback())
  }
}

/**
 * Inputs stimuli one at a time, each time next() is called.
 */
export class ManualIterator implements Iterator {
  private sampling: Array<Stimulus | null> = []
  private i = 0

  constructor(private readonly prosper: Prosper, private readonly nodeFactory: NodeFactory) {
  }

  get hasNext(): boolean {
    return this.i < this.sampling.length
  }

  iterate(sampling: Array<Stimulus | null>): void {
    this.sampling = sampling
    this.i = 0
    this.next()
  }

  next(): void {
    const input = this.sampling[this.i]
    if (input) {
      this.prosper.input(input, this.nodeFactory)
    }
    this.i++
  }

  stop(): void {
    this.sampling = []
    this.i = 0
  }
}
