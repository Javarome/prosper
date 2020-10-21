import {ProsperMemoryNode} from "./ProsperMemoryNode";
import {NodeFactory} from "./NodeFactory";

export class ProsperMemory {
  minNodeSize = 0.5;
  activationGain = 0.3;
  deactivationLoss = 0.1;
  activatedMin = 1;
  latestNodes = [];
  private graph: any;

  constructor(private sig: any) {
    this.graph = sig.graph;
  }

  edgeId(source: ProsperMemoryNode, target: ProsperMemoryNode): string {
    return `${source.id}-${target.id}`;
  }

  toJSON(): object {
    return {nodes: this.graph.nodes(), edges: this.graph.edges()};
  }

  fromJSON(data): void {
    this.graph.read(data);
  }

  activated(node: ProsperMemoryNode): void {
    const nodeStr = node.toString();
    this.graph.nodes(node.id).size += this.activationGain;
    this.log(`nodes after activation of ${nodeStr}=${this.nodesString(this.graph.nodes())}`);
  }

  deactivated(node: ProsperMemoryNode): void {
    const nodeStr = node.toString();
    this.graph.nodes(node.id).size = Math.max(node.size - this.deactivationLoss, this.minNodeSize);
    this.log(`nodes after deactivation of ${nodeStr}=${this.nodesString(this.graph.nodes())}`);
  }

  input(node: ProsperMemoryNode, nodeFactory: NodeFactory): void {
    try {
      this.addNode(node);
      this.addEdges(this.latestNodes, node);
    } catch (e) {
      this.log('Could not add: ' + e.message);
      this.latestNodes.forEach(latestNode => {
        const existingEdge = this.graph.edges().filter(edge => edge.id === this.edgeId(latestNode, node));
        if (existingEdge.length == 1) {
          this.log(`Edge ${this.edgeId(latestNode, node)} already exists`);
          const conceptNode = nodeFactory.merge(latestNode, node);
          try {
            this.addNode(conceptNode);
          } catch (e) {
            this.log('Could not add concept: ' + e.message);
          }
          this.addEdge(node, conceptNode);
          node = conceptNode;
        } else {
          this.addEdges(this.latestNodes, node);
        }
      });
    }
    this.activated(node);

    this.latestNodes = [];
    this.graph.nodes().forEach(node => {
      this.deactivated(node);
      if (node.size > this.activatedMin) {
        this.latestNodes.push(node);
      }
    });
    this.log(`latestNodes=${this.nodesString(this.latestNodes)}`);
  }

  predict(): any[] {
    const preds: any[] = [];
    this.graph.edges().forEach(e => {
      if (this.isLatestId(e.source)) {
        preds.push(e.target);
      }
    });
    return preds
  }

  reset(): void {
    this.graph.clear();
  }

  addNode(node: ProsperMemoryNode): void {
    this.log(`Adding node ${node.id}`);
    try {
      this.graph.addNode(node);
    } catch (e) {
      this.log(`Node ${node.id} already exists: ${e.message}`);
      throw e;
    }
  }

  newEdge(fromNode: ProsperMemoryNode, toNode: ProsperMemoryNode, graph): object {
    return {
      id: this.edgeId(fromNode, toNode),
      label: (graph.edges().length + 1) + '',
      source: fromNode.id,
      size: 1,
      target: toNode.id
    };
  }

  nodesString(nodes): string {
    let s = '[';
    let sep = '';
    nodes.forEach(node => {
      s += sep + node.toString();
      sep = ', ';
    });
    return s + ']';
  }

  log(msg): void {
    console.log(`ProsperMemory: ${msg}`);
  }

  addEdge(fromNode: ProsperMemoryNode, toNode: ProsperMemoryNode): void {
    const edge = this.newEdge(fromNode, toNode, this.graph);
    try {
      this.graph.addEdge(edge);
    } catch (e) {
      this.log(e);
    }
  }

  addEdges(fromNodes, toNode: ProsperMemoryNode): void {
    this.log(`Adding link from ${this.nodesString(fromNodes)} to ${toNode.id}`);
    fromNodes.forEach(fromNode => {
      this.addEdge(fromNode, toNode);
    });
  }

  private isLatestId(nodeId): boolean {
    let isLatest = false;
    this.latestNodes.forEach(l => {
      if (l.id == nodeId) {
        isLatest = true;
      }
    });
    return isLatest;
  }

  private isLatest(node): boolean {
    return this.isLatestId(node.id);
  }
}
