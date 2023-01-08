import { TechTreeComponent } from './tech-tree';
import { RaceInfo } from './race-info';
import { TownHall } from './buildings/town-hall';
import { Worker } from './characters/worker';

export class RaceDefinitions {
  static iceMarauders: RaceInfo = new RaceInfo(
    new TechTreeComponent(),
    [TownHall, Worker, Worker],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 }
    ],
    [TownHall],
    [TownHall], // todo
    true
  );
  static fireBoosters: RaceInfo = new RaceInfo(
    new TechTreeComponent(),
    [TownHall, Worker, Worker],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 }
    ],
    [TownHall],
    [TownHall], // todo
    true
  );
  static sandDwellers: RaceInfo = new RaceInfo(
    new TechTreeComponent(),
    [TownHall, Worker, Worker],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 }
    ],
    [TownHall],
    [TownHall], // todo
    true
  );
  static forestShadows: RaceInfo = new RaceInfo(
    new TechTreeComponent(),
    [TownHall, Worker, Worker],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 }
    ],
    [TownHall],
    [TownHall], // todo
    true
  );
}

export enum Race {
  IceMarauders = 'IceMarauders',
  FireBoosters = 'FireBoosters',
  SandDwellers = 'SandDwellers',
  ForestShadows = 'ForestShadows'
}
