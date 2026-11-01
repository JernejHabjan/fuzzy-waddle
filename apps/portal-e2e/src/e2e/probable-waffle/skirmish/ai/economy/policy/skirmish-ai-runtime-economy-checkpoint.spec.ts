import { expect, test } from "@playwright/test";
import { summarizeRuntimeMacroDecisions } from "./skirmish-ai-runtime-economy-checkpoint";

test("an economy checkpoint before the first decision accepts absent debug history", () => {
  expect(summarizeRuntimeMacroDecisions(undefined)).toEqual([]);
});

test("economy checkpoints retain only macro-level debug decisions", () => {
  expect(summarizeRuntimeMacroDecisions([
    { outcome: "accepted", reason: "ok", intent: { kind: "train", reasonCode: "opening:workers", objectName: "Worker" } },
    { outcome: "accepted", reason: "ok", intent: { kind: "move", reasonCode: "tactics:approach" } }
  ])).toEqual(["accepted:ok:train:Worker:opening:workers"]);
});
