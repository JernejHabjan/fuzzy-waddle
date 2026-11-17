import type { AiRuntimeBrowserTestConfig } from "./ai-runtime-browser-test-config-contract";
import { isRecord, hasOnlyKeys } from "../harness/fixtures/ai-runtime-fixture-values";
import { validAiRuntimePresetWorld } from "../presets/validation/validate-ai-runtime-preset-world";

export function isAiRuntimeBrowserTestConfig(value: unknown): value is AiRuntimeBrowserTestConfig {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["schemaVersion", "enabled", "seed", "startPaused", "presetWorld", "captureProduction", "captureCombat",
      "captureMovementOnly"])
  ) {
    return false;
  }
  const preset = value["presetWorld"];
  if (isRecord(preset) && preset["protectedRoutes"] !== undefined && value["captureProduction"] !== true) return false;
  return (
    value["schemaVersion"] === 1 &&
    value["enabled"] === true &&
    value["startPaused"] === true &&
    Number.isSafeInteger(value["seed"]) &&
    (value["seed"] as number) >= 0 &&
    (value["captureProduction"] === undefined || value["captureProduction"] === true) &&
    (value["captureMovementOnly"] === undefined || value["captureMovementOnly"] === true &&
      value["captureProduction"] === true) &&
    (value["captureCombat"] === undefined || value["captureCombat"] === true && value["captureProduction"] === true) &&
    (value["presetWorld"] === undefined || validAiRuntimePresetWorld(value["presetWorld"]))
  );
}
