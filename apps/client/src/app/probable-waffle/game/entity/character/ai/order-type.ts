export enum OrderType {
  Attack = 0,
  BeginConstruction = 1,
  ContinueConstruction = 2,
  Gather = 3,
  Move = 4,
  ReturnResources = 5,
  Stop = 6
}

export const OrderLabelToTypeMap: Record<string, OrderType> = {
  attack: OrderType.Attack,
  beginConstruction: OrderType.BeginConstruction,
  continueConstruction: OrderType.ContinueConstruction,
  gather: OrderType.Gather,
  move: OrderType.Move,
  returnResources: OrderType.ReturnResources,
  stop: OrderType.Stop
};
