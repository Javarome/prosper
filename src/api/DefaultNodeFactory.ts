import {NodeFactory} from "./NodeFactory";
import {ProsperMemoryNode} from "./ProsperMemoryNode";

export class DefaultNodeFactory implements NodeFactory {

  create(value: any): ProsperMemoryNode {
    const n = {
      id: value,
      label: value,
      x: Math.random(),
      y: Math.random(),
      size: 1,
      concept: false,
      color: undefined
    };
    n.toString = () => {
      return n.id + '(' + n.size + ')';
    };
    return n;
  }

  merge(node1: ProsperMemoryNode, node2: ProsperMemoryNode): ProsperMemoryNode {
    throw new Error('Not implemented');
  }
}
