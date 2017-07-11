"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
exports.__esModule = true;
var core_1 = require("@angular/core");
var ProsperGraph = (function () {
  function ProsperGraph($element) {
    this.$element = $element;
  }

  ProsperGraph.prototype.log = function (msg) {
    console.log(msg);
  };
  ProsperGraph.prototype.ngOnInit = function () {
    this.prosper.setMemory(this);
    var containerId = this.$element.nativeElement.id;
    var s = this.s = new sigma({
      container: containerId,
      renderer: {
        container: document.getElementById(containerId),
        type: 'canvas'
      },
      settings: {
        minNodeSize: 1,
        maxNodeSize: 16
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
    var forceAtlas2Config = {
      worker: true,
      autoStop: true,
      background: true,
      scaleRatio: 30,
      gravity: 3
    };
    var listener = s.configForceAtlas2(forceAtlas2Config);
    /*listener.bind('start stop interpolate', (event) => {
     this.log('sigma.js layout: ' + event.type);
     });*/
    var g = this.g = s.graph;
    this.latestNodes = [];
  };
  ProsperGraph.prototype.input = function (inputValue) {
    var _this = this;
    var newNodes = [];
    var node = this.newNode(inputValue);
    try {
      this.addNode(node);
      this.addEdges(this.latestNodes, node);
    } catch (e) {
      this.log(e.message);
      this.latestNodes.forEach(function (latestNode) {
        var existingEdge = _this.g.edges().filter(function (edge) {
          return edge.id === _this.edgeId(latestNode, node);
        });
        if (existingEdge.length == 1) {
          _this.log('Edge ' + _this.edgeId(latestNode, node) + ' already exists');
          var conceptNode = _this.newNode(latestNode.label + node.label);
          try {
            conceptNode.color = 'green';
            _this.addNode(conceptNode);
            conceptNode.concept = true;
          } catch (e) {
            _this.log(e.message);
          }
          _this.addEdge(node, conceptNode);
          _this.latestNodes.push(conceptNode);
          newNodes.push(conceptNode);
        } else {
          _this.addEdges(_this.latestNodes, node);
        }
      });
    }
    newNodes.push(node);
    this.latestNodes = newNodes;
    this.refresh();
    this.predict();
  };
  ProsperGraph.prototype.predict = function () {
    var _this = this;
    var preds = [];
    this.g.edges().forEach(function (e) {
      if (_this.isLatestId(e.source)) {
        preds.push(e.target);
      }
    });
    this.prosper.output(preds);
  };
  ProsperGraph.prototype.isLatestId = function (nodeId) {
    var isLatest = false;
    this.latestNodes.forEach(function (l) {
      if (l.id == nodeId) {
        isLatest = true;
      }
    });
    return isLatest;
  };
  ProsperGraph.prototype.isLatest = function (node) {
    return this.isLatestId(node.id);
  };
  ProsperGraph.prototype.reset = function () {
    this.g.clear();
    this.refresh();
  };
  ProsperGraph.prototype.refresh = function () {
    var _this = this;
    this.s.killForceAtlas2();
    this.g.nodes().forEach(function (node) {
      if (_this.isLatest(node))
        node.size = 2;
      else
        node.size = 1;
    });
    this.s.startForceAtlas2();
    setTimeout(function () {
      return _this.s.stopForceAtlas2();
    }, this.g.nodes().length * 60);
  };
  ProsperGraph.prototype.edgeId = function (source, target) {
    return source.id + '-' + target.id;
  };
  ProsperGraph.prototype.addNode = function (node) {
    this.log('Adding node ' + node.id);
    try {
      this.g.addNode(node);
    } catch (e) {
      this.log('Node ' + node.id + ' already exists: ' + e.message);
      throw e;
    }
  };
  ProsperGraph.prototype.addEdge = function (fromNode, toNode) {
    var edge = this.newEdge(fromNode, toNode);
    try {
      this.g.addEdge(edge);
    } catch (e) {
      this.log(e);
    }
  };
  ProsperGraph.prototype.addEdges = function (fromNodes, toNode) {
    var _this = this;
    this.log('Addings link from ' + JSON.stringify(fromNodes) + ' to ' + toNode.id);
    fromNodes.forEach(function (fromNode) {
      _this.addEdge(fromNode, toNode);
    });
  };
  ProsperGraph.prototype.newNode = function (value) {
    return {
      id: value,
      label: value,
      x: Math.random(),
      y: Math.random(),
      size: 1
    };
  };
  ProsperGraph.prototype.newEdge = function (fromNode, toNode) {
    return {
      id: this.edgeId(fromNode, toNode),
      source: fromNode.id,
      target: toNode.id,
      type: 'curvedArrow'
    };
  };
  return ProsperGraph;
}());
__decorate([
  core_1.Input()
], ProsperGraph.prototype, "prosper");
ProsperGraph = __decorate([
  core_1.Component({
    selector: 'prosper-graph',
    template: '<div></div>'
  })
], ProsperGraph);
exports.ProsperGraph = ProsperGraph;