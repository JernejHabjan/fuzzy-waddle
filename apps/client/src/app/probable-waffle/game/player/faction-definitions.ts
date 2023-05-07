import { TechTreeComponent } from './tech-tree';
import { FactionInfo } from './faction-info';
import { ActorType } from '../entity/assets/types/actor-type';

export enum FactionType {
  IceMarauders = 'IceMarauders',
  FireBoosters = 'FireBoosters',
  SandDwellers = 'SandDwellers',
  ForestShadows = 'ForestShadows'
}

export class FactionDefinitions {
  static iceMarauders: FactionInfo = new FactionInfo(
    FactionType.IceMarauders,
    new TechTreeComponent(),
    [ActorType.TownHall, ActorType.Worker, ActorType.Worker],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 }
    ],
    [ActorType.TownHall],
    [ActorType.TownHall], // todo
    true
  );
  static fireBoosters: FactionInfo = new FactionInfo(
    FactionType.FireBoosters,
    new TechTreeComponent(),
    [ActorType.TownHall, ActorType.Worker, ActorType.Worker],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 }
    ],
    [ActorType.TownHall],
    [ActorType.TownHall], // todo
    true
  );
  static sandDwellers: FactionInfo = new FactionInfo(
    FactionType.SandDwellers,
    new TechTreeComponent(),
    [ActorType.TownHall, ActorType.Worker, ActorType.Worker],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 }
    ],
    [ActorType.TownHall],
    [ActorType.TownHall], // todo
    true
  );
  static forestShadows: FactionInfo = new FactionInfo(
    FactionType.ForestShadows,
    new TechTreeComponent(),
    [ActorType.TownHall, ActorType.Worker, ActorType.Worker],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 }
    ],
    [ActorType.TownHall],
    [ActorType.TownHall], // todo
    true
  );

  static factionTypes: { name: string; value: FactionType }[] = [
    { name: 'Ice Marauders', value: FactionType.IceMarauders },
    { name: 'Fire Boosters', value: FactionType.FireBoosters },
    { name: 'Sand Dwellers', value: FactionType.SandDwellers },
    { name: 'Forest Shadows', value: FactionType.ForestShadows }
  ];
}
