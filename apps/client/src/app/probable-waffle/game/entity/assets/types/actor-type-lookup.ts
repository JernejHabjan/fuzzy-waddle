import { ActorType } from './actor-type';
import { Warrior } from '../characters/warrior';
import { TownHall } from '../buildings/town-hall';
import { ActorAbleToBeCreatedClass } from '../../building/production/production-queue';
import { Barracks } from '../buildings/barracks';
import { Worker } from '../characters/worker';

export const ActorTypeLookup: Record<ActorType, ActorAbleToBeCreatedClass> = {
  [ActorType.Worker]: Worker,
  [ActorType.TownHall]: TownHall,
  [ActorType.Barracks]: Barracks,
  [ActorType.Warrior]: Warrior
};
