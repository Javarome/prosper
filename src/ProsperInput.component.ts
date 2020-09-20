import {Component, ElementRef, Input, OnInit} from "@angular/core";

import {Prosper} from "./Prosper.component";
import {NodeFactory, ProsperMemoryNode} from "./ProsperGraph.component";

class DefaultNodeFactory implements NodeFactory {
  create(value: any): ProsperMemoryNode {
    const n = {
      id: value,
      label: value,
      x: Math.random(),
      y: Math.random(),
      size: 1
    };
    n.toString = function () {
      return this.id + '(' + this.size + ')';
    }
    return n;
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
    const conceptNode: ProsperMemoryNode = this.create(node1.label + ' ' + node2.label);
    conceptNode.color = 'green';
    conceptNode.concept = true;
    return conceptNode;
  }
}

interface Iterator<T> {
  hasNext?: boolean;

  iterate(sampling: Array<T>, params?: {});

  next?();
}

class AutoIterator<T> implements Iterator<T> {
  private prosper: Prosper;
  private readonly nodeFactory: NodeFactory;

  constructor(prosper: Prosper, nodeFactory: NodeFactory) {
    this.prosper = prosper;
    this.nodeFactory = nodeFactory;
  }

  iterate(sampling: Array<T>, params) {
    let i = 0;
    sampling.forEach(input => {
      if (input) {
        setTimeout(() => this.prosper.input(input, this.nodeFactory), params.speed * i++);
      }
    });
  }
}

class ManualIterator<T> implements Iterator<T> {
  private prosper: Prosper;
  private readonly nodeFactory: NodeFactory;
  private sampling: Array<T>;
  private i: number;
  private hasNext: boolean;

  constructor(prosper: Prosper, nodeFactory: NodeFactory) {
    this.prosper = prosper;
    this.nodeFactory = nodeFactory;
  }

  iterate(sampling: Array<T>) {
    this.sampling = sampling;
    this.i = 0;
    this.next();
  }

  next() {
    const input = this.sampling[this.i];
    if (input) {
      this.prosper.input(input, this.nodeFactory);
    }
    this.i++;
    this.hasNext = this.i < this.sampling.length;
  }
}

enum IterationType {
  manual = 'manual', automatic = 'auto'
}

interface IterationChoice {
  value: IterationType;
  label: string;

  create(prosper: Prosper, nodeFactory): Iterator
}

enum SampleType {
  chars = 'chars',
  words = 'words'
}

interface SampleChoice {
  value: SampleType;
  label: string;
  sample: (input, nodeFactory) => [];
  nodeFactory: NodeFactory
}

@Component({
  selector: "prosper-input",
  templateUrl: "ProsperInput.component.html",
  styleUrls: ['ProsperInput.component.scss']
})
export class ProsperInput implements OnInit {
  iteration: Iterator;
  memoryFile;

  value;

  speed: number;
  sampleTypes: SampleChoice[];
  sampleType: SampleChoice;
  empty: boolean = true;
  autoIteration: IterationChoice;
  iterationTypes;
  iterationType: IterationChoice;
  manualIteration: IterationChoice;
  @Input() prosper: Prosper;
  private readonly sampleCharsType: SampleChoice;
  private readonly sampleWordsType: SampleChoice;

  constructor(private $element: ElementRef) {
    this.value = "";
    this.speed = 0;
    this.sampleCharsType = {
      value: SampleType.chars,
      label: "Chars",
      sample: (input, nodeFactory) => input.split("").map(sample => nodeFactory.create(sample)),
      nodeFactory: new CharNodeFactory()
    };
    this.sampleWordsType = {
      value: SampleType.words,
      label: "Words",
      sample: (input, nodeFactory) => input.split(" ").map(sample => nodeFactory.create(sample)),
      nodeFactory: new WordNodeFactory()
    };
    this.sampleTypes = [this.sampleCharsType, this.sampleWordsType];
    this.sampleType = this.sampleCharsType;

    this.autoIteration = {
      value: IterationType.automatic,
      label: 'Automatic',
      create(prosper: Prosper, nodeFactory) {
        return new AutoIterator<string>(prosper, nodeFactory);
      }
    };
    this.manualIteration = {
      value: IterationType.manual,
      label: 'Manual',
      create(prosper: Prosper, nodeFactory) {
        return new ManualIterator<string>(prosper, nodeFactory);
      }
    };
    this.iterationTypes = [this.autoIteration, this.manualIteration];
    this.iterationType = this.autoIteration;
  }

  log(msg) {
    console.log(`ProsperInput: ${msg}`);
  }

  ngOnInit() {
    this.prosper.addInput(this);
  }

  reset() {
    this.prosper.reset();
    this.empty = true;
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
    } else {
      var elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(stateBlob);
      elem.download = filename;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }
  }

  replay() {
    const state: Object = this.prosper.getState();
    const inputs = state.nodes.map(node => node.concept ? null : this.sampleType.nodeFactory.create(node.id));
    this.prosper.reset();
    this.iterate(inputs);
  }

  upload() {
    const file = document.getElementById('memoryFile').files[0];
    const memoryFileReader = new FileReader();
    memoryFileReader.onloadend = (e: Event) => {
      const memoryData = JSON.parse(e.target.result);
      this.empty = memoryData.nodes.length <= 0;
      this.prosper.setState(memoryData);
    };
    memoryFileReader.readAsText(file);
  }

  submit() {
    const sampling = this.sampleType.sample(this.value, this.sampleType.nodeFactory);
    // this.prosper.input(Date.now().toString());
    this.iterate(sampling);
    this.empty = false;
    this.value = "";
    this.$element.nativeElement.querySelector("input").focus();
  }

  iterate(sampling) {
    this.iteration = this.iterationType.create(this.prosper, this.sampleType.nodeFactory);
    this.iteration.iterate(sampling, this);
  }
}
