import {Component, ElementRef, Input} from "@angular/core";

import {Prosper} from "./Prosper.component.ts";

interface SigmaNode {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
}
export interface ProsperMemoryNode extends SigmaNode {
  concept: boolean;
}
export interface NodeFactory {
  create(input: any): ProsperMemoryNode;
  merge(node1: ProsperMemoryNode, node2: ProsperMemoryNode): ProsperMemoryNode;
}

@Component({
  selector: 'prosper-graph',
  template: '<div></div>'
})
export class ProsperGraph {
  private s: any;
  private g: any;
  private minNodeSize: number;
  private latestNodes = [];

  @Input() private prosper: Prosper;

  constructor(private $element: ElementRef) {
  }

  log(msg) {
    console.log(`ProsperMemory: ${msg}`);
  }

  ngOnInit() {
    this.prosper.setMemory(this);

    const s = this.s = new sigma();
    const containerId = this.$element.nativeElement.id;
    s.addRenderer({
      container: document.getElementById(containerId),
      type: 'canvas'
    });
    this.minNodeSize = 0.5;
    s.settings({
      minNodeSize: this.minNodeSize,
      maxNodeSize: 16,
      defaultNodeColor: 'steelblue',

      //defaultEdgeHoverColor: 'red',
      // Edge
      defaultEdgeColor: 'lightblue',
      defaultEdgeType: 'curvedArrow',
      enableEdgeHovering: true,
      edgeHoverPrecision: 20,
      edgeHoverHighlightNodes: 'circle',
      edgeHoverSizeRatio: 1,
      edgeHoverExtremities: true,
      edgeColor: "default",
      edgeHoverColor: 'red',
      minArrowSize: 10,
      minEdgeSize: 0.1,
      maxEdgeSize: 1,

      // Edge label
      drawEdgeLabels: true,
      edgeLabelColor: 'default',
      defaultEdgeLabelColor: 'gray',
      defaultEdgeLabelActiveColor: 'black',
      defaultEdgeLabelSize: 12,
      edgeLabelSize: 'proportional',              // Available values: fixed, proportional
      edgeLabelAlignment: 'auto',          // Available values: auto, horizontal
      edgeLabelSizePowRatio: 1,
      edgeLabelThreshold: 1,
//            defaultEdgeHoverLabelBGColor: '#002147',
      edgeLabelHoverBGColor: 'default',
      edgeLabelHoverShadow: 'default',
      edgeLabelHoverShadowColor: '#000',
      // defaultEdgeArrow: 'source'
    });
    const forceAtlas2Config = {
      worker: true,
      autoStop: true,
      background: true,
      scaleRatio: 30,
      gravity: 3
    };
    const listener = s.configForceAtlas2(forceAtlas2Config);

    const g = this.g = s.graph;
  }

  toJSON() {
    return {nodes: this.g.nodes(), edges: this.g.edges()};
  }

  fromJSON(data) {
    this.g.read(data);
    this.refresh();
  }

  activated(node: ProsperMemoryNode) {
    node.size += 1;
  }

  deactivated(node: ProsperMemoryNode) {
    node.size = node.size < this.minNodeSize ? this.minNodeSize : node.size - 0.1;
  }

  input(node: ProsperMemoryNode, nodeFactory: NodeFactory) {
    const newNodes = [];
    try {
      this.addNode(node);
      this.activated(node);
      this.addEdges(this.latestNodes, node);
    } catch (e) {
      this.log(e.message);
      this.latestNodes.forEach(latestNode => {
        const existingEdge = this.g.edges().filter(edge => edge.id === this.edgeId(latestNode, node));
        if (existingEdge.length == 1) {
          this.log('Edge ' + this.edgeId(latestNode, node) + ' already exists');
          const conceptNode = nodeFactory.merge(latestNode, node);
          try {
            this.addNode(conceptNode);
            this.activated(conceptNode);
          } catch (e) {
            this.log(e.message);
          }
          this.addEdge(node, conceptNode);
          this.latestNodes.push(conceptNode);
          newNodes.push(conceptNode);
        } else {
          this.activated(node);
          this.addEdges(this.latestNodes, node);
        }
      });
    }
    newNodes.push(node);
    this.latestNodes = newNodes;
    this.latestNodes = [];

    this.g.nodes().forEach(node => {
      this.deactivated(node);
      if (node.size > .75) {
        this.latestNodes.push(node);
      }
    });

    this.refresh();
    this.predict();
  }

  predict() {
    const preds = [];
    this.g.edges().forEach(e => {
      if (this.isLatestId(e.source)) {
        preds.push(e.target);
      }
    });
    this.prosper.output(preds);
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

  reset() {
    this.g.clear();
    this.refresh();
  }

  refresh() {
    this.s.killForceAtlas2();
    this.s.startForceAtlas2();
    const delay = Math.max(this.g.nodes().length * 60, 300);
    setTimeout(() => this.s.stopForceAtlas2(), delay);
  }

  edgeId(source: ProsperMemoryNode, target: ProsperMemoryNode) {
    return source.id + '-' + target.id;
  }

  addNode(node: ProsperMemoryNode) {
    this.log('Adding node ' + node.id);
    try {
      this.g.addNode(node);
    } catch (e) {
      this.log('Node ' + node.id + ' already exists: ' + e.message);
      throw e;
    }
  }

  addEdge(fromNode: ProsperMemoryNode, toNode: ProsperMemoryNode) {
    const edge = this.newEdge(fromNode, toNode);
    try {
      this.g.addEdge(edge);
    } catch (e) {
      this.log(e);
    }
  }

  addEdges(fromNodes, toNode: ProsperMemoryNode) {
    this.log('Addings link from ' + JSON.stringify(fromNodes) + ' to ' + toNode.id);
    fromNodes.forEach(fromNode => {
      this.addEdge(fromNode, toNode);
    });
  }

  newEdge(fromNode: ProsperMemoryNode, toNode: ProsperMemoryNode) {
    return {
      id: this.edgeId(fromNode, toNode),
      label: (this.g.edges().length + 1) + '',
      source: fromNode.id,
      size: 1,
      target: toNode.id
    };
  }
}