import type { Vector3Simple } from "../game/vector";

export enum ProbableWaffleMapEnum {
  Sandbox = 1,
  RiverCrossing = 2,
  EmberEnclave = 3
}

export type ProbableWaffleMapType = {
  [key in ProbableWaffleMapEnum]: ProbableWaffleMapData;
};

export type ProbableWaffleMapData = {
  id: ProbableWaffleMapEnum;
  devOnly?: boolean;
  name: string;
  loader: {
    mapSceneKey: string;
    mapLoaderAssetPackPath: string;
  };
  presentation: {
    description: string;
    imagePath: string;
  };
  mapInfo: {
    startPositionsOnTile: Vector3Simple[];
    widthTiles: number;
    heightTiles: number;
  };
};

export const ProbableWaffleLevels: ProbableWaffleMapType = {
  [ProbableWaffleMapEnum.Sandbox]: {
    id: ProbableWaffleMapEnum.Sandbox,
    devOnly: true,
    name: "Sandbox (dev only)",
    loader: {
      mapSceneKey: "MapSandbox",
      mapLoaderAssetPackPath: "asset-pack-probable-waffle-river-crossing.json"
    },
    presentation: {
      description: "Only for development purposes",
      imagePath: "assets/probable-waffle/tilemaps/thumbnails/river_crossing.png"
    },
    mapInfo: {
      startPositionsOnTile: [
        { x: 10, y: 20, z: 0 },
        { x: 40, y: 40, z: 0 }
      ],
      widthTiles: 50,
      heightTiles: 50
    }
  },
  [ProbableWaffleMapEnum.RiverCrossing]: {
    id: ProbableWaffleMapEnum.RiverCrossing,
    name: "River Crossing",
    loader: {
      mapSceneKey: "MapRiverCrossing",
      mapLoaderAssetPackPath: "asset-pack-probable-waffle-river-crossing.json"
    },
    presentation: {
      description: "Navigate tactical challenges on this battlefield with vital water crossings",
      imagePath: "assets/probable-waffle/tilemaps/thumbnails/river_crossing.png"
    },
    mapInfo: {
      startPositionsOnTile: [
        { x: 10, y: 20, z: 0 },
        { x: 40, y: 40, z: 0 }
      ],
      widthTiles: 50,
      heightTiles: 50
    }
  },
  [ProbableWaffleMapEnum.EmberEnclave]: {
    id: ProbableWaffleMapEnum.EmberEnclave,
    name: "Ember Enclave",
    loader: {
      mapSceneKey: "MapEmberEnclave",
      mapLoaderAssetPackPath: "asset-pack-probable-waffle-ember-enclave.json"
    },
    presentation: {
      description:
        "Unravel the mysteries of this captivating strategic battlefield in the heart of the mystical enclave",
      imagePath: "assets/probable-waffle/tilemaps/thumbnails/ember_enclave.png"
    },
    mapInfo: {
      startPositionsOnTile: [
        { x: 10, y: 20, z: 0 },
        { x: 30, y: 10, z: 0 },
        { x: 35, y: 35, z: 0 }
      ],
      widthTiles: 50,
      heightTiles: 50
    }
  }
};
