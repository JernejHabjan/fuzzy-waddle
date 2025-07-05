import { inject, Injectable } from "@angular/core";
import { DataAccessService } from "../data-access.service";
import { DbAccessTestServiceInterface } from "./db-access-test.service.interface";

@Injectable({
  providedIn: "root"
})
export class DbAccessTestService implements DbAccessTestServiceInterface {
  private readonly dataAccessService = inject(DataAccessService);

  get(): void {
    this.dataAccessService.supabase
      .from("messages")
      .select("*")
      .then((data) => {
        console.table(data.data);
      });
  }

  add(): void {
    this.dataAccessService.supabase
      .from("messages")
      .insert({ text: "test from frontend" })
      .then((data) => {
        console.log(data);
      });
  }

  async getStorageEntry(): Promise<void> {
    const bucket1 = await this.dataAccessService.supabase.storage.from("test-bucket").download("probable-waffle.webp");
    console.log(bucket1);
  }
}
