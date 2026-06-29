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
  /**
   * Master per-map switch for the lighting system.
   * When `false`, the scene skips dynamic lighting, ambient cycling, and related light setup.
   */
  enabled?: boolean;
  /**
   * Base ambient fallback color when day/night cycle is disabled.
   */
  ambientColor?: number;
  selfShadow?: {
    /**
     * Enables Phaser 4 self-shadowing on compatible lit objects.
     * This affects how normal-mapped or self-shadow-capable renderables shade themselves.
     */
    enabled?: boolean | null;
    /**
     * Controls how soft the lit-to-shadow transition appears on self-shadowed surfaces.
     */
    penumbra?: number;
    /**
     * Threshold for flattening very subtle normal variation so self-shadowing does not overreact
     * on nearly-flat surfaces.
     */
    diffuseFlatThreshold?: number;
  };
  dropShadow?: {
    /**
     * Enables dropped terrain-shadow behavior for this map when the runtime shadow path is active.
     */
    enabled?: boolean;
    /**
     * Base shadow tint color used for dropped terrain shadows.
     */
    color?: number;
    /**
     * Shadow opacity during strongest daylight.
     */
    opacityDay?: number;
    /**
     * Shadow opacity during night-time or moonlit portions of the cycle.
     */
    opacityNight?: number;
    /**
     * Horizontal shadow stretch relative to the caster bounds.
     */
    widthScale?: number;
    /**
     * Vertical shadow thickness relative to the caster bounds.
     */
    heightScale?: number;
    /**
     * Minimum caster-to-shadow offset when the sun is high and shadows are shorter.
     */
    minOffset?: number;
    /**
     * Maximum caster-to-shadow offset when the sun is low and shadows are longer.
     */
    maxOffset?: number;
  };
  dayNightCycle?: {
    /**
     * Enables animated ambient progression across the configured keyframes.
     */
    enabled?: boolean;
    /**
     * Full in-game day/night cycle duration in milliseconds before time scaling is applied.
     */
    durationMs?: number;
    /**
     * Initial normalized time when the scene starts.
     * `0` is midnight, `0.5` is midday, and `1` wraps back to midnight.
     */
    startTimeNormalized?: number;
    /**
     * Ordered ambient-color checkpoints used to interpolate the scene tint through the day.
     */
    keyframes?: ProbableWaffleLightingAmbientKeyframe[];
  };
  keyLight?: {
    /**
     * Enables the main moving directional-style scene light used to represent the sun or moon.
     */
    enabled?: boolean;
    /**
     * Base color of the moving key light.
     */
    color?: number;
    /**
     * Peak light intensity before runtime day-phase scaling is applied.
     */
    intensity?: number;
    /**
     * Base light radius used by the moving key light.
     */
    radius?: number;
    /**
     * Z height of the key light in Phaser's light pipeline.
     */
    z?: number;
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
  }
};
