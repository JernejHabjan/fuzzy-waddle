import type { AiRuntimeBrowserTestConfigV1 } from "./ai-runtime-browser-test-config-v1";
import { isRecord, hasOnlyKeys } from "./ai-runtime-fixture-values";
import { validAiRuntimePresetWorld } from "./validate-ai-runtime-preset-world-v1";

export function isAiRuntimeBrowserTestConfigV1(value: unknown): value is AiRuntimeBrowserTestConfigV1 {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["schemaVersion", "enabled", "seed", "startPaused", "presetWorld", "captureProduction", "captureCombat",
      "calibration"])
  ) {
    return false;
  }
  const preset = value["presetWorld"];
  const calibration = value["calibration"];
  if (calibration !== undefined && (!isRecord(calibration) || preset !== undefined ||
      !hasOnlyKeys(calibration, ["targetPlayerNumber", "difficulty", "opponentArchetype"]) ||
      ![1, 2].includes(calibration["targetPlayerNumber"] as number) ||
      !["Easy", "Normal", "Hard"].includes(calibration["difficulty"] as string) ||
      !["balanced", "rush", "macro", "turtle", "tech"].includes(calibration["opponentArchetype"] as string))) return false;
  if (isRecord(preset) && preset["protectedRoutes"] !== undefined && value["captureProduction"] !== true) return false;
  return (
    value["schemaVersion"] === 1 &&
    value["enabled"] === true &&
    value["startPaused"] === true &&
    Number.isSafeInteger(value["seed"]) &&
    (value["seed"] as number) >= 0 &&
    (value["captureProduction"] === undefined || value["captureProduction"] === true) &&
    (value["captureCombat"] === undefined || value["captureCombat"] === true && value["captureProduction"] === true) &&
    (value["presetWorld"] === undefined || validAiRuntimePresetWorld(value["presetWorld"]))
  );
}
