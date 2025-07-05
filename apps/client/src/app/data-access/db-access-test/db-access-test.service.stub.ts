import { DbAccessTestServiceInterface } from "./db-access-test.service.interface";

export const dbAccessTestServiceStub = {
  get(): void {
    console.log("test");
  },
  add(): void {
    console.log("test");
  },
  async getStorageEntry(): Promise<void> {
    console.log("test");
  }
} satisfies DbAccessTestServiceInterface;
