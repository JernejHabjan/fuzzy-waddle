interface IQueue<T> {
  enqueueBack(item: T): void;
  dequeueBack(): T | undefined;
  size(): number;
  isEmpty(): boolean;
  peek(): T | undefined;

  enqueueFront(item: T): void;
  dequeueFront(): T | undefined;
  empty(): void;
}

export class Queue<T> implements IQueue<T> {
  private storage: T[] = [];

  constructor(private capacity: number = Infinity) {}

  enqueueBack(item: T): void {
    if (this.size() === this.capacity) {
      throw Error("Queue has reached max capacity, you cannot add more items");
    }
    this.storage.push(item);
  }
  dequeueBack(): T | undefined {
    return this.storage.shift();
  }
  size(): number {
    return this.storage.length;
  }
  isEmpty(): boolean {
    return this.size() === 0;
  }
  peek(): T | undefined {
    return this.storage[0];
  }
  enqueueFront(item: T): void {
    if (this.size() === this.capacity) {
      throw Error("Queue has reached max capacity, you cannot add more items");
    }
    this.storage.unshift(item);
  }
  dequeueFront(): T | undefined {
    return this.storage.pop();
  }
  empty(): void {
    this.storage = [];
  }
}
