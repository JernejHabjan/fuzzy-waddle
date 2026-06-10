import type {
  ProbableWaffleLightingAmbientKeyframe,
  ProbableWaffleLightingConfig
} from "@fuzzy-waddle/api-interfaces";

export const DEFAULT_DAY_NIGHT_CYCLE_DURATION_MS = 60_000;

const DEFAULT_AMBIENT_COLOR = 0xffffff;

const DEFAULT_AMBIENT_KEYFRAMES: ProbableWaffleLightingAmbientKeyframe[] = [
  { time: 0, ambientColor: 0x31415f },
  { time: 0.25, ambientColor: 0xe7edf7 },
  { time: 0.5, ambientColor: 0xffdeb9 },
  { time: 0.75, ambientColor: 0x28354f },
  { time: 1, ambientColor: 0x31415f }
];

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
    orbitRadius: number;
  };
};

/**
 * Resolves per-map lighting data into a fully-populated runtime config.
 * All defaults live here so the service can stay focused on runtime behavior.
 */
export function resolveSceneLightingConfig(
  mapLightingConfig: ProbableWaffleLightingConfig | undefined,
  fallbackRadius: number
): ResolvedSceneLightingConfig {
  const dayNightConfig = mapLightingConfig?.dayNightCycle;
  const keyframes = normalizeKeyframes(dayNightConfig?.keyframes);

  return {
    enabled: mapLightingConfig?.enabled ?? true,
    ambientColor: mapLightingConfig?.ambientColor ?? DEFAULT_AMBIENT_COLOR,
    selfShadow: {
      enabled: mapLightingConfig?.selfShadow?.enabled ?? true,
      penumbra: mapLightingConfig?.selfShadow?.penumbra ?? 0.45,
      diffuseFlatThreshold: mapLightingConfig?.selfShadow?.diffuseFlatThreshold ?? 1 / 3
    },
    dropShadow: {
      enabled: mapLightingConfig?.dropShadow?.enabled ?? true,
      color: mapLightingConfig?.dropShadow?.color ?? 0x000000,
      opacityDay: mapLightingConfig?.dropShadow?.opacityDay ?? 0.24,
      opacityNight: mapLightingConfig?.dropShadow?.opacityNight ?? 0.08,
      widthScale: mapLightingConfig?.dropShadow?.widthScale ?? 0.56,
      heightScale: mapLightingConfig?.dropShadow?.heightScale ?? 0.17,
      minOffset: mapLightingConfig?.dropShadow?.minOffset ?? 8,
      maxOffset: mapLightingConfig?.dropShadow?.maxOffset ?? 22
    },
    dayNightCycle: {
      enabled: dayNightConfig?.enabled ?? true,
      durationMs: dayNightConfig?.durationMs ?? DEFAULT_DAY_NIGHT_CYCLE_DURATION_MS,
      startTimeNormalized: clamp01(dayNightConfig?.startTimeNormalized ?? 0),
      keyframes
    },
    keyLight: {
      enabled: mapLightingConfig?.keyLight?.enabled ?? true,
      color: mapLightingConfig?.keyLight?.color ?? 0xffffff,
      intensity: mapLightingConfig?.keyLight?.intensity ?? 1.1,
      radius: mapLightingConfig?.keyLight?.radius ?? fallbackRadius,
      z: mapLightingConfig?.keyLight?.z ?? 200,
      orbitRadius: mapLightingConfig?.keyLight?.orbitRadius ?? Math.max(180, Math.floor(fallbackRadius * 0.35))
    }
  };
}

/**
 * Ensures the ambient keyframe list is sorted and always spans the full 0..1 cycle range.
 */
function normalizeKeyframes(
  keyframes: ProbableWaffleLightingAmbientKeyframe[] | undefined
): ProbableWaffleLightingAmbientKeyframe[] {
  const input = keyframes?.length ? keyframes : DEFAULT_AMBIENT_KEYFRAMES;
  const normalized = input
    .map((keyframe) => ({
      time: clamp01(keyframe.time),
      ambientColor: keyframe.ambientColor
    }))
    .sort((a, b) => a.time - b.time);

  if (normalized.length === 0) {
    return [...DEFAULT_AMBIENT_KEYFRAMES];
  }

  const first = normalized[0]!;
  if (first.time !== 0) {
    normalized.unshift({ time: 0, ambientColor: first.ambientColor });
  }

  const last = normalized[normalized.length - 1]!;
  if (last.time !== 1) {
    normalized.push({ time: 1, ambientColor: normalized[0]!.ambientColor });
  }

  return normalized;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
