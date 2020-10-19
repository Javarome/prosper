export interface Iterator<T> {
  hasNext?: boolean;

  iterate(sampling: Array<T>, params?: {}): void;

  next?(): void;
}
