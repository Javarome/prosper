import {ProsperMemoryNode} from "./ProsperMemoryNode";

export interface NodeFactory {

  create(input: any): ProsperMemoryNode;

  merge(node1: ProsperMemoryNode, node2: ProsperMemoryNode): ProsperMemoryNode;
}
