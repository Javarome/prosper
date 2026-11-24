import {describe, expect, it} from "vitest"
import {CharNodeFactory, WordNodeFactory} from "./NodeFactory"
import {ProsperMemory} from "./ProsperMemory"
import {Prosper} from "./Prosper"
import {AutoIterator, ManualIterator} from "./Iterator"

function learn(memory: ProsperMemory, text: string, factory = new CharNodeFactory()) {
  for (const c of text.split("")) {
    memory.input(factory.create(c), factory)
  }
}

function learnWords(memory: ProsperMemory, text: string) {
  const factory = new WordNodeFactory()
  for (const word of text.split(" ")) {
    memory.input(factory.create(word), factory)
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
    memory.spreadRatio = 0
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

  it("records the times of inputs and link crossings", () => {
    const memory = new ProsperMemory()
    learn(memory, "abxab")
    expect(memory.time).toBe(5)
    expect(memory.graph.getNodeAttribute("a", "times")).toEqual([1, 4])
    expect(memory.graph.getEdgeAttribute("a-b", "times")).toEqual([2, 5])
  })

  it("reinforces a link each time it is crossed", () => {
    const memory = new ProsperMemory()
    learn(memory, "ab")
    expect(memory.graph.getEdgeAttribute("a-b", "weight")).toBe(1)
    learn(memory, "xyzab")
    expect(memory.graph.getEdgeAttribute("a-b", "weight")).toBe(2)
  })

  it("makes a concept emerge from an already-crossed link", () => {
    const memory = new ProsperMemory()
    learn(memory, "abab")
    const concepts = memory.graph.filterNodes((_n, attrs) => attrs.concept)
    expect(concepts.length).toBeGreaterThan(0)
  })

  it("spreads activation to neighbors, proportionally to links weights", () => {
    const memory = new ProsperMemory()
    learnWords(memory, "hello how are you")
    const before = memory.graph.getNodeAttribute("how", "size")
    memory.spreadRatio = 0
    const isolated = new ProsperMemory()
    isolated.spreadRatio = 0
    learnWords(isolated, "hello how are you")
    expect(before).toBeGreaterThan(isolated.graph.getNodeAttribute("how", "size"))
  })

  it("does not spread when the spread ratio is 0", () => {
    const memory = new ProsperMemory()
    memory.spreadRatio = 0
    learn(memory, "ab")
    // a: 1 + 0.3 - 0.1 - 0.1, untouched by b's activation
    expect(memory.graph.getNodeAttribute("a", "size")).toBeCloseTo(1.1)
  })

  it("predicts the successors of active nodes, most likely first", () => {
    const memory = new ProsperMemory()
    learn(memory, "ab")
    const predictions = memory.predict()
    expect(predictions.map(p => p.id)).toContain("b")
    expect(predictions.reduce((sum, p) => sum + p.score, 0)).toBeCloseTo(1)
    for (let i = 1; i < predictions.length; i++) {
      expect(predictions[i - 1].score).toBeGreaterThanOrEqual(predictions[i].score)
    }
  })

  it("favors the most reinforced path", () => {
    const memory = new ProsperMemory()
    memory.spreadRatio = 0
    learnWords(memory, "how are you . how are you . how can I . how")
    const predictions = memory.predict()
    const are = predictions.find(p => p.id === "are")
    const can = predictions.find(p => p.id === "can")
    expect(are && can && are.score > can.score).toBe(true)
  })

  it("lists input stimuli in their input order", () => {
    const memory = new ProsperMemory()
    learn(memory, "abab")
    expect(memory.stimuli()).toEqual(["a", "b", "a", "b"])
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
    expect(restored.time).toBe(memory.time)
    expect(restored.latestNodes).toEqual(memory.latestNodes)
  })

  it("imports the legacy (sigma v1) save format", () => {
    const memory = new ProsperMemory()
    memory.fromJSON({
      nodes: [{id: "a", label: "a", size: 1.2}, {id: "b", label: "b", size: 1, concept: false}],
      edges: [{id: "a-b", source: "a", target: "b", label: "1", size: 1}]
    } as never)
    expect(memory.graph.nodes()).toEqual(["a", "b"])
    expect(memory.graph.getNodeAttribute("a", "size")).toBe(1.2)
    expect(memory.graph.getEdgeAttribute("a-b", "weight")).toBe(1)
    expect(memory.stimuli()).toEqual(["a", "b"])
  })

  it("imports saves made before times and weights existed", () => {
    const memory = new ProsperMemory()
    memory.fromJSON({
      options: {type: "directed", multi: false, allowSelfLoops: true},
      attributes: {},
      nodes: [{key: "a", attributes: {label: "a", size: 1}}, {key: "b", attributes: {label: "b", size: 1}}],
      edges: [{key: "a-b", source: "a", target: "b", attributes: {order: 1, label: "1", size: 1}}]
    } as never)
    expect(memory.graph.getEdgeAttribute("a-b", "weight")).toBe(1)
    expect(memory.graph.getNodeAttribute("a", "times")).toEqual([])
    learn(memory, "ab")
    expect(memory.graph.getEdgeAttribute("a-b", "weight")).toBe(2)
  })
})

describe("Prosper", () => {

  it("notifies stimuli and predictions", () => {
    const prosper = new Prosper()
    const factory = new CharNodeFactory()
    const events: string[] = []
    prosper.on("stimulus", e => events.push("in:" + e.detail.id))
    prosper.on("prediction", e => events.push("out:" + e.detail.map(p => p.id).join("")))
    const iterator = new ManualIterator(prosper, factory)
    iterator.iterate("ab".split("").map(c => factory.create(c)))
    expect(iterator.hasNext).toBe(true)
    iterator.next()
    expect(iterator.hasNext).toBe(false)
    expect(events).toEqual(["in:a", "out:", "in:b", "out:b"])
  })

  it("chains automatic iterations", async () => {
    const prosper = new Prosper()
    const factory = new CharNodeFactory()
    const inputs: string[] = []
    prosper.on("stimulus", e => inputs.push(e.detail.id))
    const first = new AutoIterator(prosper, factory)
    const second = new AutoIterator(prosper, factory)
    const done = new Promise<void>(resolve => second.then(resolve))
    first.then(() => second.iterate(["c", "d"].map(c => factory.create(c))))
    first.iterate(["a", "b"].map(c => factory.create(c)))
    await done
    expect(inputs).toEqual(["a", "b", "c", "d"])
    expect(second.hasNext).toBe(false)
  })
})
