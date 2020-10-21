import {Component, ViewChild} from '@angular/core';
import {ProsperInputComponent} from "./input/ProsperInputComponent";
import {ProsperOutputComponent} from "./output/ProsperOutputComponent";
import {Prosper} from "../api/Prosper";
import {ProsperMemory} from "../api/ProsperMemory";
import {ProsperGraphComponent} from "./output/graph/ProsperGraphComponent";

@Component({
  selector: 'prosper',
  templateUrl: 'ProsperComponent.html',
  styleUrls: ['ProsperComponent.scss']
})
export class ProsperComponent {
  readonly prosper: Prosper

  @ViewChild(ProsperGraphComponent)
  graph: ProsperGraphComponent

  constructor() {
    this.prosper = new Prosper()
    this.prosper.latestInput.subscribe(input => {
      this.refresh()
    })
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

  setMemory(memory: ProsperMemory): void {
    this.prosper.setMemory(memory);
  }

  getMemory(): ProsperMemory {
    return this.prosper.getMemory();
  }

  input(value: any, nodeFactory): void {
    this.prosper.input(value, nodeFactory);
    this.refresh();
  }

  output(preds): void {
    this.prosper.output(preds);
  }

  reset(): void {
    this.prosper.reset();
  }

  refresh(): void {
    this.graph.refresh();
  }

  getState(): object {
    return this.prosper.toJSON();
  }

  setState(data: string): void {
    this.prosper.fromJSON(data);
  }
}
