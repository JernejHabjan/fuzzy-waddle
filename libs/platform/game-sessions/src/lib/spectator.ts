import type { UserId } from "./player/player";

export interface BaseSpectatorData {
  userId: UserId;
}

export abstract class BaseSpectator<TData extends BaseSpectatorData = BaseSpectatorData> {
  protected constructor(public data: TData) {
    if (!data) this.resetData();
  }

  resetData() {
    this.data = {} as TData;
  }
}
