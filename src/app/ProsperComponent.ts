import {Component} from '@angular/core';
import {ProsperInputComponent} from "./input/ProsperInputComponent";
import {ProsperOutputComponent} from "./output/ProsperOutputComponent";
import {ProsperGraphComponent} from "./output/graph/ProsperGraphComponent";
import {Prosper} from "../api/Prosper";

@Component({
  selector: 'prosper',
  templateUrl: 'ProsperComponent.html',
  styleUrls: ['ProsperComponent.scss']
})
export class ProsperComponent {
  readonly prosper: Prosper

  constructor() {
    this.prosper = new Prosper()
  }

  log(msg): void {
    console.log(`Prosper: ${msg}`);
  }

  addInput(input: ProsperInputComponent): void {
    this.prosper.addInput(input);
  }

  addOutput(output: ProsperOutputComponent): void {
    this.prosper.addOutput(output);
  }

  setMemory(memory: ProsperGraphComponent): void {
    this.prosper.setMemory(memory);
  }

  getMemory(): ProsperGraphComponent {
    return this.prosper.getMemory();
  }

  input(value: any, nodeFactory): void {
    this.prosper.input(value, nodeFactory);
  }

  output(preds): void {
    this.prosper.output(preds);
  }

  reset(): void {
    this.prosper.reset();
  }

  refresh(): void {
    this.prosper.refresh();
  }

  getState(): object {
    return this.prosper.toJSON();
  }

  setState(data: string): void {
    this.prosper.fromJSON(data);
  }
}
