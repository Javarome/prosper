import {describe, expect, it} from "vitest"
import {CharNodeFactory, WordNodeFactory} from "./NodeFactory"
import {ProsperMemory} from "./ProsperMemory"
import {Prosper} from "./Prosper"
import {ManualIterator} from "./Iterator"

function learn(memory: ProsperMemory, text: string, factory = new CharNodeFactory()) {
  for (const c of text.split("")) {
    memory.input(factory.create(c), factory)
  }
}

describe("ProsperMemory", () => {

  it("links successive stimuli", () => {
    const memory = new ProsperMemory()
    learn(memory, "ab")
    expect(memory.graph.nodes()).toEqual(["a", "b"])
    expect(memory.graph.hasEdge("a-b")).toBe(true)
  })

  it("activates input nodes and decays all nodes", () => {
    const memory = new ProsperMemory()
    learn(memory, "a")
    // 1 + gain (0.3) - loss (0.1)
    expect(memory.graph.getNodeAttribute("a", "size")).toBeCloseTo(1.2)
    expect(memory.latestNodes).toEqual(["a"])
    learn(memory, "bcdef")
    expect(memory.graph.getNodeAttribute("a", "size")).toBeCloseTo(0.7)
    expect(memory.latestNodes).not.toContain("a")
  })

  it("never decays under the minimum node size", () => {
    const memory = new ProsperMemory()
    learn(memory, "abcdefghijklmnop")
    expect(memory.graph.getNodeAttribute("a", "size")).toBe(memory.minNodeSize)
  })

  it("predicts the successors of active nodes", () => {
    const memory = new ProsperMemory()
    learn(memory, "ab")
    expect(memory.predict()).toContain("b")
  })

  it("makes a concept emerge from an already-crossed link", () => {
    const memory = new ProsperMemory()
    learn(memory, "abab")
    const concepts = memory.graph.filterNodes((_n, attrs) => attrs.concept)
    expect(concepts.length).toBeGreaterThan(0)
    expect(memory.stimuli()).toEqual(["a", "b"])
  })

  it("merges words with a space", () => {
    const factory = new WordNodeFactory()
    expect(factory.merge(factory.create("hello"), factory.create("world")))
      .toEqual({id: "hello world", label: "hello world", concept: true})
  })

  it("saves and restores its state", () => {
    const memory = new ProsperMemory()
    learn(memory, "hello")
    const restored = new ProsperMemory()
    restored.fromJSON(JSON.parse(JSON.stringify(memory.toJSON())))
    expect(restored.graph.nodes()).toEqual(memory.graph.nodes())
    expect(restored.graph.edges()).toEqual(memory.graph.edges())
  })

  it("imports the legacy (sigma v1) save format", () => {
    const memory = new ProsperMemory()
    memory.fromJSON({
      nodes: [{id: "a", label: "a", size: 1.2}, {id: "b", label: "b", size: 1, concept: false}],
      edges: [{id: "a-b", source: "a", target: "b", label: "1", size: 1}]
    } as never)
    expect(memory.graph.nodes()).toEqual(["a", "b"])
    expect(memory.graph.getNodeAttribute("a", "size")).toBe(1.2)
    expect(memory.graph.hasEdge("a-b")).toBe(true)
  })
})

describe("Prosper", () => {

  it("notifies stimuli and predictions", () => {
    const prosper = new Prosper()
    const factory = new CharNodeFactory()
    const events: string[] = []
    prosper.on("stimulus", e => events.push("in:" + e.detail.id))
    prosper.on("prediction", e => events.push("out:" + e.detail.join("")))
    const iterator = new ManualIterator(prosper, factory)
    iterator.iterate("ab".split("").map(c => factory.create(c)))
    expect(iterator.hasNext).toBe(true)
    iterator.next()
    expect(iterator.hasNext).toBe(false)
    expect(events).toEqual(["in:a", "out:", "in:b", "out:b"])
  })
})
