import {Component, NgModule, VERSION} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {ProsperGraph} from "./ProsperGraph.component.ts";
import {ProsperInput} from "./ProsperInput.component.ts";

import {ProsperOutput} from "./ProsperOutput.component.ts";

@Component({
  selector: 'prosper',
  template: `
    <prosper-output [prosper]="this"></prosper-output>
    <prosper-input  [prosper]="this" id="prosperInput"></prosper-input>
    <prosper-graph  [prosper]="this" input="prosperInput" id="prosper-graph"></prosper-graph>
  `,
})
export class Prosper {
  private inputs = [];
  private outputs = [];
  private memory: ProsperGraph;

  log(msg) {
    console.log(`Prosper: ${msg}`);
  }

  addInput(input: ProsperInput) {
    this.inputs.push(input);
  }

  addOutput(output: ProsperOutput) {
    this.outputs.push(output);
  }

  setMemory(memory: ProsperGraph) {
    this.memory = memory;
  }

  input(value) {
    this.memory.input(value);
    this.outputs.forEach(output => output.input(value));
  }

  output(preds) {
    this.outputs.forEach(output => output.output(preds));
  }

  reset() {
    this.memory.reset();
    this.outputs.forEach(output => output.reset());
  }

  refresh() {
    this.memory.refresh();
  }
}