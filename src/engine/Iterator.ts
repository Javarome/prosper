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

  constructor(private readonly prosper: Prosper, private readonly nodeFactory: NodeFactory,
              private readonly delay = 0) {
  }

  get hasNext(): boolean {
    return this.remaining > 0
  }

  iterate(sampling: Array<Stimulus | null>): void {
    this.stop()
    const inputs = sampling.filter((s): s is Stimulus => Boolean(s))
    this.remaining = inputs.length
    this.timers = inputs.map((input, i) => setTimeout(() => {
      this.remaining--
      this.prosper.input(input, this.nodeFactory)
    }, this.delay * i))
  }

  next(): void {
  }

  stop(): void {
    this.timers.forEach(clearTimeout)
    this.timers = []
    this.remaining = 0
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
