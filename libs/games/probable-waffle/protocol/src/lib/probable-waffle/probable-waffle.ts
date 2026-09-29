import { ProbableWaffleMapEnum } from "./probable-waffle-map-enum";
import type { ProbableWaffleMapType } from "./probable-waffle-map-type";

export { ProbableWaffleMapEnum } from "./probable-waffle-map-enum";
export type { ProbableWaffleMapKey } from "./probable-waffle-map-key";
export type { ProbableWaffleMapType } from "./probable-waffle-map-type";
export type { ProbableWaffleLightingAmbientKeyframe } from "./probable-waffle-lighting-ambient-keyframe";
export type { ProbableWaffleLightingConfig } from "./probable-waffle-lighting-config";
export type { ProbableWaffleMapData } from "./probable-waffle-map-data";

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
      selfShadow: {
        enabled: true,
        penumbra: 0.45,
        diffuseFlatThreshold: 0.3
      },
      dropShadow: {
        enabled: true,
        color: 0x000000,
        opacityDay: 0.26,
        opacityNight: 0.1,
        widthScale: 0.58,
        heightScale: 0.18,
        minOffset: 8,
        maxOffset: 24
      },
      dayNightCycle: {
        startTimeNormalized: 0.3,
        keyframes: [
          { time: 0, ambientColor: 0x43536d }, // 12:00 AM
          { time: 0.1666666667, ambientColor: 0x43536d }, // 4:00 AM
          { time: 0.2083333333, ambientColor: 0x8294b0 }, // 5:00 AM
          { time: 0.2916666667, ambientColor: 0xb9c7d8 }, // 7:00 AM
          { time: 0.5, ambientColor: 0xf7faff }, // 12:00 PM
          { time: 0.5833333333, ambientColor: 0xfff6e8 }, // 2:00 PM
          { time: 0.75, ambientColor: 0xd6dee8 }, // 6:00 PM
          { time: 0.875, ambientColor: 0xa0b0c4 }, // 9:00 PM
          { time: 0.9583333333, ambientColor: 0x43536d }, // 11:00 PM
          { time: 1, ambientColor: 0x43536d } // 12:00 AM
        ]
      },
      keyLight: {
        color: 0xfff3dc,
        intensity: 0.25,
        radius: 2400,
        z: 1000
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
      selfShadow: {
        enabled: true,
        penumbra: 0.45,
        diffuseFlatThreshold: 0.32
      },
      dropShadow: {
        enabled: true,
        color: 0x000000,
        opacityDay: 0.22,
        opacityNight: 0.08,
        widthScale: 0.56,
        heightScale: 0.16,
        minOffset: 7,
        maxOffset: 20
      },
      dayNightCycle: {
        startTimeNormalized: 0.3,
        keyframes: [
          { time: 0, ambientColor: 0x43546f }, // 12:00 AM
          { time: 0.1666666667, ambientColor: 0x43546f }, // 4:00 AM
          { time: 0.2083333333, ambientColor: 0x7f93b2 }, // 5:00 AM
          { time: 0.2916666667, ambientColor: 0xb9cce4 }, // 7:00 AM
          { time: 0.5, ambientColor: 0xf7fbff }, // 12:00 PM
          { time: 0.5833333333, ambientColor: 0xffffff }, // 2:00 PM
          { time: 0.75, ambientColor: 0xdde6f3 }, // 6:00 PM
          { time: 0.875, ambientColor: 0xa8bbd4 }, // 9:00 PM
          { time: 0.9583333333, ambientColor: 0x43546f }, // 11:00 PM
          { time: 1, ambientColor: 0x43546f } // 12:00 AM
        ]
      },
      keyLight: {
        color: 0xdfe9ff,
        intensity: 0.25,
        radius: 2400,
        z: 1000
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
      selfShadow: {
        enabled: true,
        penumbra: 0.42,
        diffuseFlatThreshold: 0.28
      },
      dropShadow: {
        enabled: true,
        color: 0x1a0904,
        opacityDay: 0.3,
        opacityNight: 0.12,
        widthScale: 0.62,
        heightScale: 0.2,
        minOffset: 10,
        maxOffset: 28
      },
      dayNightCycle: {
        startTimeNormalized: 0.3,
        keyframes: [
          { time: 0, ambientColor: 0x5f4035 }, // 12:00 AM
          { time: 0.1666666667, ambientColor: 0x5f4035 }, // 4:00 AM
          { time: 0.2083333333, ambientColor: 0xa78570 }, // 5:00 AM
          { time: 0.2916666667, ambientColor: 0xd8b397 }, // 7:00 AM
          { time: 0.5, ambientColor: 0xffecd6 }, // 12:00 PM
          { time: 0.5833333333, ambientColor: 0xffd9b6 }, // 2:00 PM
          { time: 0.75, ambientColor: 0xeec5a7 }, // 6:00 PM
          { time: 0.875, ambientColor: 0xc09c8f }, // 9:00 PM
          { time: 0.9583333333, ambientColor: 0x5f4035 }, // 11:00 PM
          { time: 1, ambientColor: 0x5f4035 } // 12:00 AM
        ]
      },
      keyLight: {
        color: 0xff9f66,
        intensity: 0.25,
        radius: 2400,
        z: 1000
      }
    }
  },
  [ProbableWaffleMapEnum.AiOpenEconomy]: {
    id: ProbableWaffleMapEnum.AiOpenEconomy,
    devOnly: true,
    testOnly: true,
    name: "AI Open Economy (test only)",
    loader: {
      mapSceneKey: "MapAiOpenEconomy",
      mapLoaderAssetPackPath: "asset-pack-probable-waffle-ai-open-economy.json"
    },
    presentation: {
      description: "Frozen campaign-free topology for deterministic skirmish scenarios",
      imagePath: "assets/probable-waffle/tilemaps/thumbnails/ember_enclave.png"
    },
    mapInfo: {
      startPositionsOnTile: [
        { x: 10, y: 20, z: 0 },
        { x: 30, y: 10, z: 0 }
      ],
      widthTiles: 50,
      heightTiles: 50
    },
    lighting: { ambientColor: 0xe6edf5 }
  }
};
