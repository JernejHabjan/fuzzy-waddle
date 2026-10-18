import type { AiRuntimeBrowserTestConfigV1 } from "./ai-runtime-browser-test-config-v1";
import { isRecord, hasOnlyKeys } from "./ai-runtime-fixture-values";
import { validAiRuntimePresetWorld } from "./validate-ai-runtime-preset-world-v1";

export function isAiRuntimeBrowserTestConfigV1(value: unknown): value is AiRuntimeBrowserTestConfigV1 {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["schemaVersion", "enabled", "seed", "startPaused", "presetWorld", "captureProduction"])
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
    (value["presetWorld"] === undefined || validAiRuntimePresetWorld(value["presetWorld"]))
  );
}
