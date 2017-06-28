/*
 * Copyright (c) 2017 Jérôme Beau (javarome@gmail.com)
 */

class ProsperGraphController {
  constructor($element, $rootScope, $log) {
    this.$log = $log;
    this.$rootScope = $rootScope;
    const s = this.s = new sigma({
      container: $element[0].id,
      renderer: {
        container: document.getElementById($element[0].id),
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
    //    $log.info('sigma.js event: ' + e.type);
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
     this.$log.info('sigma.js layout: ' + event.type);
     });*/

    const g = this.g = s.graph;
    this.latestNodes = [];

    $rootScope.$on("prosperReset", event => {
      this.g.clear();
      this.refresh();
    });
    $rootScope.$on("prosperRefresh", event => {
      this.refresh();
    });
    $rootScope.$on("prosperInput", (event, inputValue) => {
      const newNodes = [];
      const node = this.newNode(inputValue);
      try {
        this.addNode(node);
        this.addEdges(this.latestNodes, node);
      } catch (e) {
        this.$log.info(e.message);
        this.latestNodes.forEach(latestNode => {
          const existingEdge = g.edges().filter(edge => edge.id === this.edgeId(latestNode, node));
          if (existingEdge.length == 1) {
            this.$log.info('Edge ' + this.edgeId(latestNode, node) + ' already exists');
            const conceptNode = this.newNode(latestNode.label + node.label);
            try {
              conceptNode.color = 'green';
              this.addNode(conceptNode);
              conceptNode.concept = true;
            } catch (e) {
              this.$log.info(e.message);
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
    });
  }

  predict() {
    const preds = [];
    this.g.edges().forEach(e => {
      if (this.isLatestId(e.source)) {
        preds.push(e.target);
      }
    });
    this.$rootScope.$emit('prosperPredict', preds);
  }

  private isLatestId(nodeId): boolean {
    let isLatest = false;
    this.latestNodes.forEach(l => {if (l.id == nodeId) {isLatest = true; } });
    return isLatest;
  }

  private isLatest(node): boolean {
    return this.isLatestId(node.id);
  }

  refresh() {
    this.s.killForceAtlas2();
    this.g.nodes().forEach(node => {
      if (this.isLatest(node)) node.size= 2; else node.size= 1;
    });
    this.s.startForceAtlas2();
    setTimeout(() => this.s.stopForceAtlas2(), this.g.nodes().length * 60);
  }

  edgeId(source, target) {
    return source.id + '-' + target.id;
  }

  addNode(node) {
    this.$log.info('Adding node ' + node.id);
    try {
      this.g.addNode(node);
    } catch (e) {
      this.$log.info('Node ' + node.id + ' already exists: ' + e.message);
      throw e;
    }
  }
  addEdge(fromNode, toNode) {
    const edge = this.newEdge(fromNode, toNode);
    try {
      this.g.addEdge(edge);
    } catch (e) {
      this.$log.info(e);
    }
  }
  addEdges(fromNodes, toNode) {
    this.$log.info('Addings link from ' + JSON.stringify(fromNodes) + ' to ' + toNode.id);
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
const ProsperGraph = {
  controller: ProsperGraphController
};

class ProsperInputController {
  constructor($rootScope, $element, $scope) {
    this.$rootScope = $rootScope;
    this.$element = $element;
    this.value = '';
    this.speed = 0;
    this.sampleCharsType = {value:'chars', label:'Chars'};
    this.sampleWordsType = {value:'words', label:'Words'};
    this.items = [this.sampleCharsType, this.sampleWordsType];
    this.sampleType = this.sampleCharsType;
  }
  sampleChars(value: string) {
    return value.split('');
  }
  sampleWords(value: string) {
    return value.split(' ');
    const splits = [];
    let from = 0;
    let spaceFound;
    let spacePos = 0;
    do {
      spacePos = value.indexOf(' ', from);
      spaceFound = spacePos >= 0;
      if (!spaceFound) {
        spacePos = value.length;
      }
      splits.push(value.substring(from, spacePos));
      if (spaceFound) {
        splits.push(' ');
      }
      from = spacePos + 1;
    } while (spaceFound);
    return splits;
  }
  reset() {
    this.$rootScope.$emit("prosperReset");
  }
  refresh() {
    this.$rootScope.$emit("prosperRefresh");
  }
  submit() {
    const sample = this.sampleType === this.sampleCharsType ? this.sampleChars : this.sampleWords;
    const values = sample(this.value);
    // this.$rootScope.$emit("prosperInput", Date.now().toString());
    let i = 0;
    values.forEach(value => {
      setTimeout(() => this.$rootScope.$emit("prosperInput", value), this.speed * i++);
    });
    this.value = '';
    this.$rootScope.$applyAsync(() => this.$element.find('input')[0].focus());
  }
}
const ProsperInput = {
  controller: ProsperInputController,
  controllerAs: "inputCtrl",
  bindToController: true,
  template:
  '<h1>Prosper</h1>'
  + '<form ng-submit="inputCtrl.submit()">'
  + '<label for="sample-type">Sample</label> '
  + '<select id="sample-type" ng-model="inputCtrl.sampleType" ng-options="item.label for item in inputCtrl.items"> '
  + '<label for="prosper-input">Input</label> '
  + '<input id="prosper-input" ng-model="inputCtrl.value"> '
  + 'with <label for="speed">delay</label> <input id="speed" ng-model="inputCtrl.speed" type="number">'
  + '<input type="submit">'
  + '</form>'
  + '<button ng-click="inputCtrl.refresh()">Refresh</button> '
  + '<button ng-click="inputCtrl.reset()">Reset</button>'
};

class ProsperOutputController {
  constructor($element, $rootScope) {
    const outputElem = $element.find('output');

    let SEP = '';
    let input = '';
    $rootScope.$on("prosperInput", (event, inputValue) => {
      input += SEP + inputValue;
      SEP = ' ';
    });
    $rootScope.$on("prosperPredict", (event, prediction) => {
      outputElem.append(`<div class="question">${input}</div>`);

      let answer = '';
      SEP = '';
      prediction.forEach(p => {
        answer += SEP + p;
      });
      outputElem.append(`<div class="answer">${answer}</div>`);
      input = '';
      outputElem[0].querySelector('.answer:last-child').scrollIntoView();
    });
  }
}
const ProsperOutput = {
  template: '<output></output>',
  controller: ProsperOutputController
};

angular
  .module("prosper", [])
  .component("prosperInput", ProsperInput)
  .component("prosperGraph", ProsperGraph)
  .component("prosperOutput", ProsperOutput)
;
