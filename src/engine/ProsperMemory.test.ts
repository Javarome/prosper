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

  it("reinforces a link each time it is crossed", () => {
    const memory = new ProsperMemory()
    learn(memory, "ab")
    const first = memory.graph.getEdgeAttribute("a-b", "weight")
    learn(memory, "xyzab")
    expect(memory.graph.getEdgeAttribute("a-b", "weight")).toBeGreaterThan(first)
  })

  it("links more strongly from recent (more active) context than from older context", () => {
    const memory = new ProsperMemory()
    memory.spreadRatio = 0
    learn(memory, "abc")
    expect(memory.graph.hasEdge("a-c")).toBe(true)
    expect(memory.graph.getEdgeAttribute("b-c", "weight"))
      .toBeGreaterThan(memory.graph.getEdgeAttribute("a-c", "weight"))
  })

  it("links a node to itself only if it was just perceived", () => {
    const chars = new ProsperMemory()
    learn(chars, "hello")
    expect(chars.graph.hasEdge("l-l")).toBe(true)

    const repeated = new ProsperMemory()
    learnWords(repeated, "how how")
    expect(repeated.graph.hasEdge("how-how")).toBe(true)

    const separated = new ProsperMemory()
    learnWords(separated, "hello how are you hi how")
    expect(separated.graph.hasEdge("how-how")).toBe(false)
  })

  it("makes a concept emerge from an already-crossed link", () => {
    const memory = new ProsperMemory()
    learn(memory, "abab")
    const concepts = memory.graph.filterNodes((_n, attrs) => attrs.concept)
    expect(concepts.length).toBeGreaterThan(0)
  })

  it("spreads activation to successors only", () => {
    const memory = new ProsperMemory()
    learnWords(memory, "hello how are you hello")
    const isolated = new ProsperMemory()
    isolated.spreadRatio = 0
    learnWords(isolated, "hello how are you hello")
    // "hello" anticipates "how"…
    expect(memory.graph.getNodeAttribute("how", "size"))
      .toBeGreaterThan(isolated.graph.getNodeAttribute("how", "size"))
  })

  it("does not spread activation back to predecessors", () => {
    const memory = new ProsperMemory()
    learn(memory, "xyz")
    const isolated = new ProsperMemory()
    isolated.spreadRatio = 0
    learn(isolated, "xyz")
    expect(memory.graph.getNodeAttribute("x", "size")).toBeCloseTo(isolated.graph.getNodeAttribute("x", "size"))
    expect(memory.graph.getNodeAttribute("y", "size")).toBeCloseTo(isolated.graph.getNodeAttribute("y", "size"))
  })

  it("keeps the most recently perceived node as the most active one", () => {
    const memory = new ProsperMemory()
    learn(memory, "hel")
    const sizes = memory.latestNodes.map(id => memory.graph.getNodeAttribute(id, "size"))
    expect(memory.graph.getNodeAttribute("l", "size")).toBe(Math.max(...sizes))
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
    learn(memory, "abca")
    const predictions = memory.predict()
    expect(predictions.map(p => p.id)).toContain("b")
    expect(predictions.reduce((sum, p) => sum + p.score, 0)).toBeCloseTo(1)
    for (let i = 1; i < predictions.length; i++) {
      expect(predictions[i - 1].score).toBeGreaterThanOrEqual(predictions[i].score)
    }
  })

  it("does not predict what was just perceived from older context", () => {
    const memory = new ProsperMemory()
    learnWords(memory, "hello how are you hello how")
    expect(memory.predict()[0]?.id).toBe("are")
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
  })

  it("imports saves made before weights existed", () => {
    const memory = new ProsperMemory()
    memory.fromJSON({
      options: {type: "directed", multi: false, allowSelfLoops: true},
      attributes: {},
      nodes: [{key: "a", attributes: {label: "a", size: 1}}, {key: "b", attributes: {label: "b", size: 1}}],
      edges: [{key: "a-b", source: "a", target: "b", attributes: {order: 1, label: "1", size: 1}}]
    } as never)
    expect(memory.graph.getEdgeAttributes("a-b")).toEqual({weight: 1})
    learn(memory, "ab")
    expect(memory.graph.getEdgeAttribute("a-b", "weight")).toBeGreaterThan(1)
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
    iterator.iterate("aba".split("").map(c => factory.create(c)))
    iterator.next()
    expect(iterator.hasNext).toBe(true)
    iterator.next()
    expect(iterator.hasNext).toBe(false)
    expect(events).toEqual(["in:a", "out:", "in:b", "out:", "in:a", "out:b"])
  })

  it("records inputs to replay them in their input order", () => {
    const prosper = new Prosper()
    const factory = new CharNodeFactory()
    "abab".split("").forEach(c => prosper.input(factory.create(c), factory))
    expect(prosper.stimuli()).toEqual(["a", "b", "a", "b"])
    prosper.fromJSON(prosper.toJSON())
    expect(prosper.stimuli()).toEqual(["a", "b"])
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
