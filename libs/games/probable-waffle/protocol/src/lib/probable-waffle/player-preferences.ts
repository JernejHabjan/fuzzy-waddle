/** Discrete camera zoom levels supported by the authored map rendering. */
export type ProbableWaffleCameraDistance = 0.5 | 1 | 2 | 4 | 8;

/** Single-player-only simulation speeds; multiplayer always remains Normal. */
export type ProbableWaffleSinglePlayerSpeed = "slow" | "normal" | "fast";

/**
 * Versioned personal preferences synchronized for an authenticated player.
 * These values never define match-authoritative visibility or multiplayer cadence.
 */
export interface ProbableWafflePlayerPreferences {
  version: 1;
  lockToScreen: boolean;
  enabledMouseCornerMovement: boolean;
  enableSceneLightingEffects: boolean;
  homeScreenBackground: "ashfall" | "constellation";
  automaticallySaveReplays: boolean;
  profanityFilter: boolean;
  showPing: boolean;
  showActionsPerMinute: boolean;
  showFps: boolean;
  showTimeElapsed: boolean;
  defaultCameraDistance: ProbableWaffleCameraDistance;
  maximumCameraDistance: ProbableWaffleCameraDistance;
  enableSubtitles: boolean;
  defaultSinglePlayerSpeed: ProbableWaffleSinglePlayerSpeed;
}

/** Payload accepted by the authenticated preference endpoint. */
export interface UpdateProbableWafflePlayerPreferencesDto {
  preferences: ProbableWafflePlayerPreferences;
}

/** Validates preference JSON received from HTTP or persistent storage. */
export function isProbableWafflePlayerPreferences(value: unknown): value is ProbableWafflePlayerPreferences {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProbableWafflePlayerPreferences>;
  const cameraDistances: readonly unknown[] = [0.5, 1, 2, 4, 8];
  return (
    candidate.version === 1 &&
    typeof candidate.lockToScreen === "boolean" &&
    typeof candidate.enabledMouseCornerMovement === "boolean" &&
    typeof candidate.enableSceneLightingEffects === "boolean" &&
    (candidate.homeScreenBackground === "ashfall" || candidate.homeScreenBackground === "constellation") &&
    typeof candidate.automaticallySaveReplays === "boolean" &&
    typeof candidate.profanityFilter === "boolean" &&
    typeof candidate.showPing === "boolean" &&
    typeof candidate.showActionsPerMinute === "boolean" &&
    typeof candidate.showFps === "boolean" &&
    typeof candidate.showTimeElapsed === "boolean" &&
    cameraDistances.includes(candidate.defaultCameraDistance) &&
    cameraDistances.includes(candidate.maximumCameraDistance) &&
    typeof candidate.enableSubtitles === "boolean" &&
    (candidate.defaultSinglePlayerSpeed === "slow" ||
      candidate.defaultSinglePlayerSpeed === "normal" ||
      candidate.defaultSinglePlayerSpeed === "fast")
  );
}
