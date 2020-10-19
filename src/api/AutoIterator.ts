import {Prosper} from "./Prosper";
import {NodeFactory} from "./NodeFactory";
import {Iterator} from "../util/Iterator";

export class AutoIterator<T> implements Iterator<T> {

  constructor(private prosper: Prosper, private nodeFactory: NodeFactory) {
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
