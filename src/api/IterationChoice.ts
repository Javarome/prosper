import {IterationType} from "./IterationType";
import {Prosper} from "./Prosper";
import {Iterator} from "../util/Iterator";

export interface IterationChoice<T> {

  value: IterationType;
  label: string;

  create(prosper: Prosper, nodeFactory): Iterator<T>;
}
