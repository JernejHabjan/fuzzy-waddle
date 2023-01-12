import { ActorType } from './actor-type';
import { Worker } from './worker';
import { ActorAbleToBeCreatedClass } from '../buildings/production-queue';
import { TownHall } from '../buildings/town-hall';
import { Barracks } from '../buildings/barracks';
import { Warrior } from './warrior';

export const ActorTypeLookup: Record<ActorType, ActorAbleToBeCreatedClass> = {
  [ActorType.Worker]: Worker,
  [ActorType.TownHall]: TownHall,
  [ActorType.Barracks]: Barracks,
  [ActorType.Warrior]: Warrior
};
