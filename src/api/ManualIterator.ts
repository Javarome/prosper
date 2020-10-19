import {Prosper} from "./Prosper";
import {NodeFactory} from "./NodeFactory";
import {Iterator} from "../util/Iterator";

export class ManualIterator<T> implements Iterator<T> {

  hasNext: boolean;
  private sampling: Array<T>;
  private i: number;

  constructor(private prosper: Prosper, private nodeFactory: NodeFactory) {
  }

  iterate(sampling: Array<T>): void {
    this.sampling = sampling;
    this.i = 0;
    this.next();
  }

  next(): void {
    const input = this.sampling[this.i];
    if (input) {
      this.prosper.input(input, this.nodeFactory);
    }
    this.i++;
    this.hasNext = this.i < this.sampling.length;
  }
}
