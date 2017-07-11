import {Component, ElementRef, Input} from "@angular/core";

import {Prosper} from "./Prosper.component.ts";

@Component({
  selector: 'prosper-graph',
  template: '<div></div>'
})
export class ProsperGraph {
  private s: any;
  private g: any;
  private latestNodes: Array;

  @Input()
  private prosper: Prosper;

  constructor(private $element: ElementRef) {
  }

  log(msg) {
    console.log(`ProsperMemory: ${msg}`);
  }

  ngOnInit() {
    this.prosper.setMemory(this);

    const containerId = this.$element.nativeElement.id;
    const s = this.s = new sigma({
      container: containerId,
      renderer: {
        container: document.getElementById(containerId),
        type: 'canvas'
      },
      settings: {
        minNodeSize: 1,
        maxNodeSize: 16,
      },
      drawingProperties: {
        defaultLabelBGColor: "lightgreen"
      }
    });
    s.settings({
      //enableEdgeHovering: true,
      //edgeHoverSizeRatio: 2,
      defaultNodeColor: 'steelblue',
      edgeColor: 'default',
      defaultEdgeColor: '#ec5148',
      // defaultEdgeColor: '#ccc',
      // defaultEdgeArrow: 'source'
      minArrowSize: 10
    });
    //s.bind(s.events, (e) => {
    //    this.log('sigma.js event: ' + e.type);
    //});

    /*const noOverlapConfig = {
     nodeMargin: 3.0,
     scaleNodes: 1.3
     };*/
    const forceAtlas2Config = {
      worker: true,
      autoStop: true,
      background: true,
      scaleRatio: 30,
      gravity: 3
    };
    const listener = s.configForceAtlas2(forceAtlas2Config);
    /*listener.bind('start stop interpolate', (event) => {
     this.log('sigma.js layout: ' + event.type);
     });*/

    const g = this.g = s.graph;
    this.latestNodes = [];
  }

  input(inputValue) {
    const newNodes = [];
    const node = this.newNode(inputValue);
    try {
      this.addNode(node);
      this.addEdges(this.latestNodes, node);
    } catch (e) {
      this.log(e.message);
      this.latestNodes.forEach(latestNode => {
        const existingEdge = this.g.edges().filter(edge => edge.id === this.edgeId(latestNode, node));
        if (existingEdge.length == 1) {
          this.log('Edge ' + this.edgeId(latestNode, node) + ' already exists');
          const conceptNode = this.newNode(latestNode.label + node.label);
          try {
            conceptNode.color = 'green';
            this.addNode(conceptNode);
            conceptNode.concept = true;
          } catch (e) {
            this.log(e.message);
          }
          this.addEdge(node, conceptNode);
          this.latestNodes.push(conceptNode);
          newNodes.push(conceptNode);
        } else {
          this.addEdges(this.latestNodes, node);
        }
      });
    }
    newNodes.push(node);
    this.latestNodes = newNodes;
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
    this.g.nodes().forEach(node => {
      if (this.isLatest(node)) node.size = 2; else node.size = 1;
    });
    this.s.startForceAtlas2();
    setTimeout(() => this.s.stopForceAtlas2(), this.g.nodes().length * 60);
  }

  edgeId(source, target) {
    return source.id + '-' + target.id;
  }

  addNode(node) {
    this.log('Adding node ' + node.id);
    try {
      this.g.addNode(node);
    } catch (e) {
      this.log('Node ' + node.id + ' already exists: ' + e.message);
      throw e;
    }
  }

  addEdge(fromNode, toNode) {
    const edge = this.newEdge(fromNode, toNode);
    try {
      this.g.addEdge(edge);
    } catch (e) {
      this.log(e);
    }
  }

  addEdges(fromNodes, toNode) {
    this.log('Addings link from ' + JSON.stringify(fromNodes) + ' to ' + toNode.id);
    fromNodes.forEach(fromNode => {
      this.addEdge(fromNode, toNode);
    });
  }

  newNode(value) {
    return {
      id: value,
      label: value,
      x: Math.random(),
      y: Math.random(),
      size: 1
    };
  }

  newEdge(fromNode, toNode) {
    return {
      id: this.edgeId(fromNode, toNode),
      source: fromNode.id,
      target: toNode.id,
      type: 'curvedArrow'
    };
  }
}