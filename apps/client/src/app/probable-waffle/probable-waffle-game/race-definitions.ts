import { TechTreeComponent } from './tech-tree';
import { RaceInfo } from './race-info';
import { TownHall } from './buildings/town-hall';
import { Worker } from './characters/worker';
import { ActorType } from './characters/actor-type';

export enum RaceType {
  IceMarauders = 'IceMarauders',
  FireBoosters = 'FireBoosters',
  SandDwellers = 'SandDwellers',
  ForestShadows = 'ForestShadows'
}

export class RaceDefinitions {
  static iceMarauders: RaceInfo = new RaceInfo(
    RaceType.IceMarauders,
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
  static fireBoosters: RaceInfo = new RaceInfo(
    RaceType.FireBoosters,
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
  static sandDwellers: RaceInfo = new RaceInfo(
    RaceType.SandDwellers,
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
  static forestShadows: RaceInfo = new RaceInfo(
    RaceType.ForestShadows,
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

  static raceTypes: { name: string; value: RaceType }[] = [
    { name: 'Ice Marauders', value: RaceType.IceMarauders },
    { name: 'Fire Boosters', value: RaceType.FireBoosters },
    { name: 'Sand Dwellers', value: RaceType.SandDwellers },
    { name: 'Forest Shadows', value: RaceType.ForestShadows }
  ];
}
