import { BaseData } from "../data";

export interface BasePlayerControllerData extends BaseData {
  userId: string | null;
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
