interface SigmaNode {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
}

export interface ProsperMemoryNode extends SigmaNode {
  color: string;
  concept: boolean;
}
