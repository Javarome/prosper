import {Component, ElementRef, Input} from "@angular/core";

import {Prosper} from "./Prosper.component.ts";
import {NodeFactory} from "./ProsperGraph.component.ts";

class DefaultNodeFactory implements NodeFactory {
  create(value: any): ProsperMemoryNode {
    return {
      id: value,
      label: value,
      x: Math.random(),
      y: Math.random(),
      size: 1
    };
  }
}

class CharNodeFactory extends DefaultNodeFactory {
  merge(node1: ProsperMemoryNode, node2: ProsperMemoryNode) {
    const conceptNode = this.create(node1.label + node2.label);
    conceptNode.color = 'green';
    conceptNode.concept = true;
    return conceptNode;
  }
}

class WordNodeFactory extends DefaultNodeFactory {
  merge(node1: ProsperMemoryNode, node2: ProsperMemoryNode) {
    const conceptNode = this.create(node1.label + ' ' + node2.label);
    conceptNode.color = 'green';
    conceptNode.concept = true;
    return conceptNode;
  }
}

@Component({
  selector: "prosper-input",
  templateUrl: "/src/ProsperInput.component.html"
})
export class ProsperInput {
  private value;
  private speed: number;
  private sampleCharsType;
  private sampleWordsType;
  private items;
  private sampleType;

  @Input() private prosper: Prosper;
  
  constructor(private $element: ElementRef) {
    this.value = "";
    this.speed = 0;
    this.sampleCharsType = {
      value: "chars",
      label: "Chars",
      sample: input => input.split(""),
      nodeFactory: new CharNodeFactory()
    };
    this.sampleWordsType = {
      value: "words",
      label: "Words",
      sample: input => input.split(" "),
      nodeFactory: new WordNodeFactory()
    };
    this.items = [this.sampleCharsType, this.sampleWordsType];
    this.sampleType = this.sampleCharsType;
  }

  log(msg) {
    console.log(`ProsperInput: ${msg}`);
  }

  ngOnInit() {
    this.prosper.addInput(this);
  }

  reset() {
    this.prosper.reset();
  }

  refresh() {
    this.prosper.refresh();
  }

  save() {
    const state = this.prosper.getState();
    const jsonState = JSON.stringify(state);
    const stateBlob = new Blob([jsonState], {type: "application/json"});
    const filename = 'prosper-memory.json';
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(stateBlob, filename);
    }
    else {
      var elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(stateBlob);
      elem.download = filename;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }
  }

  submit() {
    const sampling = this.sampleType.sample(this.value);
    const nodeFactory = this.sampleType.nodeFactory;
    // this.prosper.input(Date.now().toString());
    let i = 0;
    sampling.forEach(sample => {
      const newNode = nodeFactory.create(sample);
      setTimeout(() => this.prosper.input(newNode, nodeFactory), this.speed * i++);
    });
    this.value = "";
    this.$element.nativeElement.querySelector("input").focus();
  }
}
