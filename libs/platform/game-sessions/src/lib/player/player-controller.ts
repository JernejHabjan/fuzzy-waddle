import type { BaseData } from "../data";
import type { UserId } from "./player";

export interface BasePlayerControllerData extends BaseData {
  userId: UserId | null;
}

export abstract class BasePlayerController<TData extends BasePlayerControllerData = BasePlayerControllerData> {
  protected constructor(public data: TData) {
    if (!data) this.resetData();
  }

  resetData() {
    this.data = {
      userId: null
    } as TData;
  }
}
