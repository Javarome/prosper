import {DefaultNodeFactory} from "./DefaultNodeFactory";
import {ProsperMemoryNode} from "../output/graph/ProsperMemoryNode";

export class CharNodeFactory extends DefaultNodeFactory {
  merge(node1: ProsperMemoryNode, node2: ProsperMemoryNode): ProsperMemoryNode {
    const conceptNode = this.create(node1.label + node2.label);
    conceptNode.color = 'green';
    conceptNode.concept = true;
    return conceptNode;
  }
}
