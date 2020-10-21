import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {ProsperComponent} from "../../ProsperComponent";
import {ProsperMemory} from "../../../api/ProsperMemory";


export declare var sigma: any;


@Component({
  selector: 'prosper-graph',
  template: '<div></div>',
  styleUrls: ['ProsperGraphComponent.scss']

})
export class ProsperGraphComponent implements OnInit {

  @Input() private prosper: ProsperComponent;

  private memory: ProsperMemory;
  private sig: any;

  constructor(private $element: ElementRef) {
  }

  log(msg): void {
    console.log(`ProsperGraphComponent: ${msg}`);
  }

  ngOnInit(): void {
    const minNodeSize = 0.5
    const s = this.sig = new sigma();
    const containerId = this.$element.nativeElement.id;
    s.addRenderer({
      container: document.getElementById(containerId),
      type: 'canvas'
    });
    s.settings({
      minNodeSize,
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
    this.memory = new ProsperMemory(s)
    this.prosper.setMemory(this.memory);
  }

  toJSON(): object {
    return this.memory.toJSON();
  }

  fromJSON(data): void {
    this.memory.fromJSON(data);
    this.refresh();
  }

  reset(): void {
    this.memory.reset();
    this.refresh();
  }

  refresh(): void {
    this.sig.killForceAtlas2();
    this.sig.startForceAtlas2();
    const delay = Math.max(this.sig.graph.nodes().length * 60, 300);
    setTimeout(() => this.sig.stopForceAtlas2(), delay);
  }
}
