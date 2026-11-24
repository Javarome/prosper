import type {Stimulus} from "./MemoryNode"

/**
 * Creates stimuli from raw values, and concepts from merged stimuli.
 */
export interface NodeFactory {

  create(value: string): Stimulus

  merge(node1: Stimulus, node2: Stimulus): Stimulus
}

export class DefaultNodeFactory implements NodeFactory {

  create(value: string): Stimulus {
    return {id: value, label: value, concept: false}
  }

  merge(_node1: Stimulus, _node2: Stimulus): Stimulus {
    throw new Error("Not implemented")
  }
}

/**
 * Merges characters without separator ("a" + "b" => "ab").
 */
export class CharNodeFactory extends DefaultNodeFactory {

  merge(node1: Stimulus, node2: Stimulus): Stimulus {
    return {...this.create(node1.label + node2.label), concept: true}
  }
}

/**
 * Merges words with a space separator ("hello" + "world" => "hello world").
 */
export class WordNodeFactory extends DefaultNodeFactory {

  merge(node1: Stimulus, node2: Stimulus): Stimulus {
    return {...this.create(node1.label + " " + node2.label), concept: true}
  }
}
