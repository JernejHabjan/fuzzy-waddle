import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { nativePresetControlSucceeded } from "./skirmish-ai-native-mission-evidence";

function unloadControl(kind: "applied" | "completed" | "rejected", reason: string) {
  return {
    kind: "preset_control",
    control: {
      id: "raid-unload",
      phase: "applied",
      command: { execution: { commandId: "unload-1" } },
      outcomes: [{ commandId: "unload-1", kind, reason }]
    }
  } as unknown as Extract<AiRuntimeProductionFactV1, { kind: "preset_control" }>;
}

test("native unload accepts completed application and rejects dispatch-only outcomes", () => {
  expect(nativePresetControlSucceeded(unloadControl("completed", "applied"), "raid-unload")).toBe(true);
  expect(nativePresetControlSucceeded(unloadControl("applied", "applied"), "raid-unload")).toBe(true);
  expect(nativePresetControlSucceeded(unloadControl("rejected", "invalid_target"), "raid-unload")).toBe(false);
  expect(nativePresetControlSucceeded(unloadControl("completed", "applied"), "escort-unload")).toBe(false);
});
