import {SampleType} from "./SampleType";
import {NodeFactory} from "../output/graph/NodeFactory";

export interface SampleChoice {
  value: SampleType;
  label: string;
  sample: (input, nodeFactory) => [];
  nodeFactory: NodeFactory;
}
