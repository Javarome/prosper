import {Iterator} from "./Iterator";
import {NodeFactory} from "../output/graph/NodeFactory";
import {ProsperComponent} from "../ProsperComponent";

export class ManualIterator<T> implements Iterator<T> {
  hasNext: boolean;
  private readonly nodeFactory: NodeFactory;
  private sampling: Array<T>;
  private i: number;
  private prosper: ProsperComponent;

  constructor(prosper: ProsperComponent, nodeFactory: NodeFactory) {
    this.prosper = prosper;
    this.nodeFactory = nodeFactory;
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
