export abstract class BaseGameState<TData> {
  protected constructor(public data: TData) {
    if (!data) this.resetData();
  }

  resetData() {
    this.data = {} as TData;
  }
}
