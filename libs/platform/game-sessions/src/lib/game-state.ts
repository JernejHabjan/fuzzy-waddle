export abstract class BaseGameState<TData> {
  protected constructor(public data: TData) {
    if (!data || Object.keys(data).length === 0) {
      this.resetData();
    }
  }

  resetData() {
    this.data = {} as TData;
  }
}
