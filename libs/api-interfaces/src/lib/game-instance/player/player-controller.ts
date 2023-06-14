import { BaseData } from '../data';

export abstract class BasePlayerController<TData extends BaseData = BaseData> {
  protected constructor(public data: TData) {
    if (!data) this.resetData();
  }

  resetData() {
    this.data = {} as TData;
  }
}
