import {IterationType} from "./IterationType";
import {ProsperComponent} from "../ProsperComponent";
import {Iterator} from "./Iterator";

export interface IterationChoice<T> {
  value: IterationType;
  label: string;

  create(prosper: ProsperComponent, nodeFactory): Iterator<T>;
}
