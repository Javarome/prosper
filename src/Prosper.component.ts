import {Component} from "@angular/core";
import {ProsperGraph} from "./ProsperGraph.component";
import {ProsperInput} from "./ProsperInput.component";
import {ProsperOutput} from "./ProsperOutput.component";

@Component({
  selector: 'prosper',
  template: `
    <prosper-input [prosper]="this" id="prosperInput"></prosper-input>
    <prosper-output [prosper]="this"></prosper-output>
    <prosper-graph [prosper]="this" input="prosperInput" id="prosper-graph"></prosper-graph>
  `,
  styleUrls: ['Prosper.component.scss']
})
export class Prosper {
  memory: ProsperGraph;

  private inputs = [];
  private outputs = [];

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

  getMemory(): ProsperGraph {
    return this.memory;
  }

  input(value: any, nodeFactory) {
    this.memory.input(value, nodeFactory);
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

  getState(): Object {
    return this.memory.toJSON();
  }

  setState(data: string) {
    this.memory.fromJSON(data);
  }
}
