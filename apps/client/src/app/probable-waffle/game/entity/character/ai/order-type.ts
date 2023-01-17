import { ActorAbleToBeBuiltClass } from '../../actor/components/builder-component';

export type BeginConstructionArgs = [ ActorAbleToBeBuiltClass];

export enum OrderType {
  Attack = 0,
  BeginConstruction = 1,
  ContinueConstruction = 2,
  Gather = 3,
  Move = 4,
  ReturnResources = 5,
  Stop = 6
}
