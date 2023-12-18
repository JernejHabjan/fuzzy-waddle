import { Vector3Simple } from "../game/vector";

export enum ProbableWaffleLevelEnum {
  RiverCrossing = 1,
  EmberEnclave = 2
}

export type ProbableWaffleLevelType = {
  [key in ProbableWaffleLevelEnum]: ProbableWaffleLevelData;
};

export type ProbableWaffleLevelData = {
  id: ProbableWaffleLevelEnum;
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

export const ProbableWaffleLevels: ProbableWaffleLevelType = {
  [ProbableWaffleLevelEnum.RiverCrossing]: {
    id: ProbableWaffleLevelEnum.RiverCrossing,
    name: "River Crossing",
    loader: {
      mapSceneKey: "MapRiverCrossing",
      mapLoaderAssetPackPath: "asset-pack-probable-waffle-river-crossing.json"
    },
    presentation: {
      description: "Navigate tactical challenges on this battlefield with vital water crossings",
      imagePath: "river_crossing.png"
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
  [ProbableWaffleLevelEnum.EmberEnclave]: {
    id: ProbableWaffleLevelEnum.EmberEnclave,
    name: "Ember Enclave",
    loader: {
      mapSceneKey: "MapEmberEnclave",
      mapLoaderAssetPackPath: "asset-pack-probable-waffle-ember-enclave.json"
    },
    presentation: {
      description:
        "Unravel the mysteries of this captivating strategic battlefield in the heart of the mystical enclave",
      imagePath: "ember_enclave.png"
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
