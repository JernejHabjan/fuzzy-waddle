import type { ProbableWaffleLightingAmbientKeyframe } from "@fuzzy-waddle/probable-waffle-protocol";

export type ResolvedSceneLightingConfig = {
  enabled: boolean;
  ambientColor: number;
  selfShadow: {
    enabled: boolean | null;
    penumbra: number;
    diffuseFlatThreshold: number;
  };
  dropShadow: {
    enabled: boolean;
    color: number;
    opacityDay: number;
    opacityNight: number;
    widthScale: number;
    heightScale: number;
    minOffset: number;
    maxOffset: number;
  };
  dayNightCycle: {
    enabled: boolean;
    durationMs: number;
    startTimeNormalized: number;
    keyframes: ProbableWaffleLightingAmbientKeyframe[];
  };
  keyLight: {
    enabled: boolean;
    color: number;
    intensity: number;
    radius: number;
    z: number;
  };
};
