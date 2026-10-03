import type { BaseData } from "../data";

export abstract class BasePlayerState<TData extends BaseData = BaseData> {
  protected constructor(public data: TData) {
    if (!data) this.resetData();
  }

  resetData() {
    this.data = {} as TData;
  }
}
