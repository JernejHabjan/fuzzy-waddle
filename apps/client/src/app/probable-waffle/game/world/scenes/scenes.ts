import { TilePlacementData } from '../managers/controllers/input/tilemap/tilemap-input.handler';

export enum Scenes {
  'GrasslandScene' = 'GrasslandScene',
  'PlaygroundScene' = 'PlaygroundScene'
}

export enum MapIds {
  'GrasslandSmall' = 'GrasslandSmall',
  'GrasslandLarge' = 'GrasslandLarge'
}

export type MapInfo = {
  id: MapIds;
  name: string;
  description: string;
  image: string;
  startPositions: TilePlacementData[];
  mapWidth: number;
  mapHeight: number;
};

export class Maps {
  static readonly maps: MapInfo[] = [
    {
      id: MapIds.GrasslandSmall,
      name: 'Grassland',
      description:
        'Engage in intense skirmishes on a compact grassland map, where every move counts. Limited resources and tight quarters demand cunning tactics in this RTS arena.',
      image: 'start-small.png',
      startPositions: [
        { tileXY: { x: 2, y: 2 }, z: 0 },
        { tileXY: { x: 6, y: 9 }, z: 0 }
      ],
      mapWidth: 10,
      mapHeight: 10
    },
    {
      id: MapIds.GrasslandLarge,
      name: 'Grassland Large',
      description:
        'Explore a sprawling grassland teeming with resources and potential pitfalls. Navigate strategic chokepoints to outmaneuver your foes and secure victory in this RTS battleground.',
      image: 'start-large.png',
      startPositions: [
        { tileXY: { x: 20, y: 20 }, z: 0 },
        { tileXY: { x: 80, y: 80 }, z: 0 },
        { tileXY: { x: 20, y: 80 }, z: 0 },
        { tileXY: { x: 80, y: 20 }, z: 0 }
      ],
      mapWidth: 100,
      mapHeight: 100
    }
  ];
}
