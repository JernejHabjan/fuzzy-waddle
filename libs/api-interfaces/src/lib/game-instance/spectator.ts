export interface BaseSpectatorData {
  userId: string;
}

export abstract class BaseSpectator<TData extends BaseSpectatorData = BaseSpectatorData> {
  protected constructor(public data: TData) {
    if (!data) this.resetData();
  }

  resetData() {
    this.data = {} as TData;
  }
}
