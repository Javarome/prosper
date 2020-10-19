import {Iterator} from "./Iterator";
import {ProsperComponent} from "../ProsperComponent";
import {NodeFactory} from "../output/graph/NodeFactory";

export class AutoIterator<T> implements Iterator<T> {
  private prosper: ProsperComponent;
  private readonly nodeFactory: NodeFactory;

  constructor(prosper: ProsperComponent, nodeFactory: NodeFactory) {
    this.prosper = prosper;
    this.nodeFactory = nodeFactory;
  }

  iterate(sampling: Array<T>, params): void {
    let i = 0;
    sampling.forEach(input => {
      if (input) {
        setTimeout(() => this.prosper.input(input, this.nodeFactory), params.speed * i++);
      }
    });
  }
}
