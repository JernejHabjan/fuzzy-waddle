export enum OrderType {
  Attack = "Attack",
  Build = "Build",
  Gather = "Gather",
  Move = "Move",
  ReturnResources = "ReturnResources",
  Stop = "Stop",
  Repair = "Repair",
  Heal = "Heal",
  EnterContainer = "EnterContainer"
}

export const OrderLabelToTypeMap: Record<string, OrderType> = {
  attack: OrderType.Attack,
  build: OrderType.Build,
  gather: OrderType.Gather,
  move: OrderType.Move,
  returnResources: OrderType.ReturnResources,
  stop: OrderType.Stop,
  repair: OrderType.Repair,
  heal: OrderType.Heal,
  enterContainer: OrderType.EnterContainer
};
