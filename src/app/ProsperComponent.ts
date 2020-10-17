import {Component} from '@angular/core';
import {ProsperInputComponent} from "./input/ProsperInputComponent";
import {ProsperOutputComponent} from "./output/ProsperOutputComponent";
import {ProsperGraphComponent} from "./output/graph/ProsperGraphComponent";

@Component({
  selector: 'prosper',
  templateUrl: 'ProsperComponent.html',
  styleUrls: ['ProsperComponent.scss']
})
export class ProsperComponent {
  memory: ProsperGraphComponent;

  private inputs = [];
  private outputs = [];

  log(msg): void {
    console.log(`Prosper: ${msg}`);
  }

  addInput(input: ProsperInputComponent): void {
    this.inputs.push(input);
  }

  addOutput(output: ProsperOutputComponent): void {
    this.outputs.push(output);
  }

  setMemory(memory: ProsperGraphComponent): void {
    this.memory = memory;
  }

  getMemory(): ProsperGraphComponent {
    return this.memory;
  }

  input(value: any, nodeFactory): void {
    this.memory.input(value, nodeFactory);
    this.outputs.forEach(output => output.input(value));
  }

  output(preds): void {
    this.outputs.forEach(output => output.output(preds));
  }

  reset(): void {
    this.memory.reset();
    this.outputs.forEach(output => output.reset());
  }

  refresh(): void {
    this.memory.refresh();
  }

  getState(): object {
    return this.memory.toJSON();
  }

  setState(data: string): void {
    this.memory.fromJSON(data);
  }
}
