import type { Vector3Simple } from "../game/vector";

export enum ProbableWaffleMapEnum {
  Sandbox = 1,
  RiverCrossing = 2,
  EmberEnclave = 3
}

export type ProbableWaffleMapType = {
  [key in ProbableWaffleMapEnum]: ProbableWaffleMapData;
};

export type ProbableWaffleLightingAmbientKeyframe = {
  /**
   * Normalized cycle position between 0 and 1.
   */
  time: number;
  ambientColor: number;
};

export type ProbableWaffleLightingConfig = {
  enabled?: boolean;
  /**
   * Base ambient fallback color when day/night cycle is disabled.
   */
  ambientColor?: number;
  dayNightCycle?: {
    enabled?: boolean;
    durationMs?: number;
    startTimeNormalized?: number;
    keyframes?: ProbableWaffleLightingAmbientKeyframe[];
  };
  keyLight?: {
    enabled?: boolean;
    color?: number;
    intensity?: number;
    radius?: number;
    z?: number;
    orbitRadius?: number;
  };
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
  lighting?: ProbableWaffleLightingConfig;
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
    },
    lighting: {
      ambientColor: 0xe6edf5,
      dayNightCycle: {
        startTimeNormalized: 0.2,
        keyframes: [
          { time: 0, ambientColor: 0x364663 },
          { time: 0.25, ambientColor: 0xe6edf5 },
          { time: 0.5, ambientColor: 0xffe8c9 },
          { time: 0.75, ambientColor: 0x2d3954 },
          { time: 1, ambientColor: 0x364663 }
        ]
      },
      keyLight: {
        color: 0xfff3dc,
        intensity: 1.15,
        radius: 1150,
        z: 210,
        orbitRadius: 420
      }
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
    },
    lighting: {
      ambientColor: 0xe7eef8,
      dayNightCycle: {
        keyframes: [
          { time: 0, ambientColor: 0x30405f },
          { time: 0.25, ambientColor: 0xe7eef8 },
          { time: 0.5, ambientColor: 0xf4f9ff },
          { time: 0.75, ambientColor: 0x283752 },
          { time: 1, ambientColor: 0x30405f }
        ]
      },
      keyLight: {
        color: 0xdfe9ff,
        intensity: 1.05,
        radius: 1200,
        z: 225,
        orbitRadius: 480
      }
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
    },
    lighting: {
      ambientColor: 0xffd7b0,
      dayNightCycle: {
        startTimeNormalized: 0.1,
        keyframes: [
          { time: 0, ambientColor: 0x4d2f24 },
          { time: 0.25, ambientColor: 0xffd7b0 },
          { time: 0.5, ambientColor: 0xffbe88 },
          { time: 0.75, ambientColor: 0x3a2622 },
          { time: 1, ambientColor: 0x4d2f24 }
        ]
      },
      keyLight: {
        color: 0xff9f66,
        intensity: 1.25,
        radius: 1260,
        z: 250,
        orbitRadius: 460
      }
    }
  }
};
