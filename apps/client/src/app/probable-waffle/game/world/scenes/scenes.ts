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
      description: 'A small grassland',
      image: 'grasslands-small.png',
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
      description: 'A large grassland',
      image: 'grasslands-large.png',
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
