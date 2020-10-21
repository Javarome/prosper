import {ProsperInputComponent} from "../app/input/ProsperInputComponent";
import {ProsperOutputComponent} from "../app/output/ProsperOutputComponent";
import {ProsperMemory} from "./ProsperMemory";
import {Subject} from "rxjs";

export class Prosper {
  private memory: ProsperMemory;
  private readonly inputs: ProsperInputComponent[] = [];
  private readonly outputs: ProsperOutputComponent[] = [];

  private _latestInput = new Subject()

  get latestInput() {
    return this._latestInput.asObservable()
  }

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

  setMemory(memory: ProsperMemory): void {
    this.memory = memory;
  }

  getMemory(): ProsperMemory {
    return this.memory;
  }

  input(value: any, nodeFactory): void {
    this.memory.input(value, nodeFactory);
    this._latestInput.next(value)
    const preds = this.memory.predict();
    this.outputs.forEach(output => output.input(value));
    this.output(preds);
  }

  output(preds): void {
    this.outputs.forEach(output => output.output(preds));
  }

  reset(): void {
    this.memory.reset();
    this.outputs.forEach(output => output.reset());
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
