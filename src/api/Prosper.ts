import {ProsperGraphComponent} from "../app/output/graph/ProsperGraphComponent";
import {ProsperInputComponent} from "../app/input/ProsperInputComponent";
import {ProsperOutputComponent} from "../app/output/ProsperOutputComponent";

export class Prosper {
  private memory: ProsperGraphComponent;
  private readonly inputs = [];
  private readonly outputs = [];

  get minNodeSize(): number {
    return this.memory.minNodeSize
  }

  set minNodeSize(value: number) {
    this.memory.minNodeSize = value
  }

  get activationGain(): number {
    return this.memory.activationGain
  }

  set activationGain(value) {
    this.memory.activationGain = value
  }

  get deactivationLoss(): number {
    return this.memory.deactivationLoss
  }

  set deactivationLoss(value) {
    this.memory.deactivationLoss = value
  }

  get activatedMin(): number {
    return this.memory.activatedMin
  }

  set activatedMin(value) {
    this.memory.activatedMin = value
  }

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

  toJSON(): object {
    return this.memory.toJSON()
  }

  fromJSON(data: string) {
    this.memory.fromJSON(data)
  }
}
