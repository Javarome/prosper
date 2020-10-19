import {SampleType} from "./SampleType";
import {NodeFactory} from "../../api/NodeFactory";

export interface SampleChoice {
  value: SampleType;
  label: string;
  sample: (input, nodeFactory) => [];
  nodeFactory: NodeFactory;
}
