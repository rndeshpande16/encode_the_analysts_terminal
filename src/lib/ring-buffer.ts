export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0;
  private _length = 0;
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this._length < this.capacity) this._length++;
  }

  last(): T | undefined {
    if (this._length === 0) return undefined;
    const idx = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[idx];
  }

  updateLast(item: T): void {
    if (this._length === 0) return;
    const idx = (this.head - 1 + this.capacity) % this.capacity;
    this.buffer[idx] = item;
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this._length) return undefined;
    const start = this._length < this.capacity ? 0 : this.head;
    const idx = (start + index) % this.capacity;
    return this.buffer[idx];
  }

  get length(): number {
    return this._length;
  }

  toArray(): T[] {
    const result: T[] = [];
    const start = this._length < this.capacity ? 0 : this.head;
    for (let i = 0; i < this._length; i++) {
      result.push(this.buffer[(start + i) % this.capacity] as T);
    }
    return result;
  }

  lastN(n: number): T[] {
    const count = Math.min(n, this._length);
    const result: T[] = [];
    for (let i = this._length - count; i < this._length; i++) {
      result.push(this.get(i) as T);
    }
    return result;
  }

  clear(): void {
    this.head = 0;
    this._length = 0;
    this.buffer = new Array(this.capacity);
  }
}
