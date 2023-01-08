import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';

export enum Scenes {
  'GrasslandScene' = 'GrasslandScene',
  'PlaygroundScene' = 'PlaygroundScene'
}

export type MapInfo = {
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
      name: 'Grassland',
      description: 'A small grassland',
      image: 'grasslands-small.png',
      startPositions: [
        { tileXY: { x: 2, y: 2 }, z: 0 },
        { tileXY: { x: 8, y: 8 }, z: 0 }
      ],
      mapWidth: 10,
      mapHeight: 10
    },
    {
      name: 'Grassland Large',
      description: 'A large grassland',
      image: 'grasslands-large.png',
      startPositions: [
        { tileXY: { x: 2, y: 2 }, z: 0 },
        { tileXY: { x: 80, y: 80 }, z: 0 }
      ],
      mapWidth: 100,
      mapHeight: 100
    }
  ];
}
