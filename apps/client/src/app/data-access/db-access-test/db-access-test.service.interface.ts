export interface DbAccessTestServiceInterface {
  get(): void;
  add(): void;
  getStorageEntry(): Promise<void>;
}
