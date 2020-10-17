import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {ProsperComponent} from "../../ProsperComponent";

export declare var sigma: any;

interface SigmaNode {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
}

export interface ProsperMemoryNode extends SigmaNode {
  color: string;
  concept: boolean;
}

export interface NodeFactory {
  create(input: any): ProsperMemoryNode;

  merge(node1: ProsperMemoryNode, node2: ProsperMemoryNode): ProsperMemoryNode;
}

@Component({
  selector: 'prosper-graph',
  template: '<div></div>',
  styleUrls: ['ProsperGraphComponent.scss']

})
export class ProsperGraphComponent implements OnInit {

  minNodeSize = 0.5;
  activationGain = 0.3;
  deactivationLoss = 0.1;
  activatedMin = 1;
  @Input() private prosper: ProsperComponent;

  private s: any;
  private g: any;
  private latestNodes = [];

  constructor(private $element: ElementRef) {
  }

  static nodesString(nodes): string {
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

  ngOnInit(): void {
    this.prosper.setMemory(this);

    const s = this.s = new sigma();
    const containerId = this.$element.nativeElement.id;
    s.addRenderer({
      container: document.getElementById(containerId),
      type: 'canvas'
    });
    s.settings({
      minNodeSize: this.minNodeSize,
      maxNodeSize: 16,
      defaultNodeColor: 'steelblue',

      // defaultEdgeHoverColor: 'red',
      // Edge
      defaultEdgeColor: 'lightblue',
      defaultEdgeType: 'curvedArrow',
      enableEdgeHovering: true,
      edgeHoverPrecision: 20,
      edgeHoverHighlightNodes: 'circle',
      edgeHoverSizeRatio: 1,
      edgeHoverExtremities: true,
      edgeColor: 'default',
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
    this.g = s.graph;
  }

  toJSON(): object {
    return {nodes: this.g.nodes(), edges: this.g.edges()};
  }

  fromJSON(data): void {
    this.g.read(data);
    this.refresh();
  }

  activated(node: ProsperMemoryNode): void {
    const nodeStr = node.toString();
    this.g.nodes(node.id).size += this.activationGain;
    this.log(`nodes after activation of ${nodeStr}=${ProsperGraphComponent.nodesString(this.g.nodes())}`);
  }

  deactivated(node: ProsperMemoryNode): void {
    const nodeStr = node.toString();
    this.g.nodes(node.id).size = Math.max(node.size - this.deactivationLoss, this.minNodeSize);
    this.log(`nodes after deactivation of ${nodeStr}=${ProsperGraphComponent.nodesString(this.g.nodes())}`);
  }

  input(node: ProsperMemoryNode, nodeFactory: NodeFactory): void {
    try {
      this.addNode(node);
      this.addEdges(this.latestNodes, node);
    } catch (e) {
      this.log('Could not add: ' + e.message);
      this.latestNodes.forEach(latestNode => {
        const existingEdge = this.g.edges().filter(edge => edge.id === this.edgeId(latestNode, node));
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
    this.g.nodes().forEach(node => {
      this.deactivated(node);
      if (node.size > this.activatedMin) {
        this.latestNodes.push(node);
      }
    });
    this.log(`latestNodes=${ProsperGraphComponent.nodesString(this.latestNodes)}`);

    this.refresh();
    this.predict();
  }

  predict(): void {
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

  reset(): void {
    this.g.clear();
    this.refresh();
  }

  refresh(): void {
    this.s.killForceAtlas2();
    this.s.startForceAtlas2();
    const delay = Math.max(this.g.nodes().length * 60, 300);
    setTimeout(() => this.s.stopForceAtlas2(), delay);
  }

  edgeId(source: ProsperMemoryNode, target: ProsperMemoryNode): string {
    return source.id + '-' + target.id;
  }

  addNode(node: ProsperMemoryNode): void {
    this.log('Adding node ' + node.id);
    try {
      this.g.addNode(node);
    } catch (e) {
      this.log('Node ' + node.id + ' already exists: ' + e.message);
      throw e;
    }
  }

  addEdge(fromNode: ProsperMemoryNode, toNode: ProsperMemoryNode): void {
    const edge = this.newEdge(fromNode, toNode);
    try {
      this.g.addEdge(edge);
    } catch (e) {
      this.log(e);
    }
  }

  addEdges(fromNodes, toNode: ProsperMemoryNode): void {
    this.log(`Adding link from ${ProsperGraphComponent.nodesString(fromNodes)} to ${toNode.id}`);
    fromNodes.forEach(fromNode => {
      this.addEdge(fromNode, toNode);
    });
  }

  newEdge(fromNode: ProsperMemoryNode, toNode: ProsperMemoryNode): object {
    return {
      id: this.edgeId(fromNode, toNode),
      label: (this.g.edges().length + 1) + '',
      source: fromNode.id,
      size: 1,
      target: toNode.id
    };
  }
}
