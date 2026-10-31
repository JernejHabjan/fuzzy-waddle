import { test as it, expect } from "@playwright/test";
import { nativeReplayCapsuleBlocker, nativeReplayCapsuleDigest, type NativeReplayCapsule } from
  "./skirmish-ai-native-replay-capsule";

const saved = { owner: { tick: 599, decisionSequence: 29, matchId: "original-match", seed: 759 },
  profileVersion: "skirmish-ai-v1", profileDifficulty: "normal" } as unknown as NativeReplayCapsule["saved"];
const body: Omit<NativeReplayCapsule, "payloadDigest"> = { schemaVersion: 1, sourceRevision: "a".repeat(40),
  fixtureDigest: "original-fixture", mapId: "AI Open Economy (test only)", saved,
  control: { ...saved, owner: { ...saved.owner, tick: 801, decisionSequence: 40 } },
  checkpoint: { id: "opaque-native-record", revision: 1 } as NativeReplayCapsule["checkpoint"],
  trace: { overflow: false, records: Array.from({ length: 11 }, (_, index) => ({ tick: 600 + index * 20,
    sequence: 30 + index, inputDigest: `input-${index}`, resultDigest: `result-${index}`,
    profileDigest: `profile-${index}`, catalogDigest: `catalog-${index}`, observationDigest: `observation-${index}`,
    priorStateDigest: `state-${index}`, outcomesDigest: `outcomes-${index}` })), retainedInputs: [] },
  inputs: { fromTick: 599, throughTick: 801, frameMilliseconds: 50, simulationTimeScale: 1, externalCommandCount: 0 },
  };
const capsule: NativeReplayCapsule = { ...body, payloadDigest: nativeReplayCapsuleDigest(body) };
const blocker = (value: NativeReplayCapsule) => nativeReplayCapsuleBlocker(value, body.sourceRevision, body.fixtureDigest);

it("admits only a complete sealed native autonomous interval for the exact source/map/configuration", () => {
  expect(blocker(capsule)).toBeNull();
  for (const changed of [{ ...capsule, sourceRevision: "b".repeat(40) }, { ...capsule, mapId: "other-map" },
    { ...capsule, fixtureDigest: "other-config" }]) expect(blocker(changed)).toBe("source_map_config_mismatch");
  expect(blocker({ ...capsule, checkpoint: { ...capsule.checkpoint, revision: 2 } })).toBe("native_capsule_digest_mismatch");
});

it("reports missing ranges when a retained decision or required interval prefix/suffix is removed", () => {
  expect(blocker({ ...capsule, inputs: { ...capsule.inputs, fromTick: 600 } })).toBe("missing_input_ranges");
  expect(blocker({ ...capsule, inputs: { ...capsule.inputs, throughTick: 800 } })).toBe("missing_input_ranges");
  expect(blocker({ ...capsule, trace: { ...capsule.trace, records: capsule.trace.records.filter((_, index) => index !== 3) } }))
    .toBe("missing_input_ranges");
  expect(blocker({ ...capsule, trace: { ...capsule.trace, records: capsule.trace.records.slice(0, -1) } }))
    .toBe("missing_input_ranges");
  expect(blocker({ ...capsule, trace: { ...capsule.trace, overflow: true } })).toBe("incomplete_native_capture");
  expect(blocker({ ...capsule, inputs: { ...capsule.inputs, externalCommandCount: 1 } })).toBe("unsupported_external_inputs");
});
