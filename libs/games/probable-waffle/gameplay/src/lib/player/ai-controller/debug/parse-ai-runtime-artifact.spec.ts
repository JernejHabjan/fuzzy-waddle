import { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import { parseAiRuntimeArtifact } from "./parse-ai-runtime-artifact";
import { digestAiReproJson } from "./ai-repro-json-digest";

function artifact() {
  const payload = { controllerState: {}, observation: {}, authoritativeProjection: {}, outcomes: [] };
  return { manifest: { schemaVersion: 1, kind: "runtime", privacy: "host_confidential", display: { label: "Original incident" },
    completeness: { observation: "complete", priorState: "complete", outcomes: "complete", alternatives: "not_recorded",
      missingRanges: [], truncatedEventCount: 0 }, replayInputs: { sourceRevision: "a".repeat(40), dirtySourceDigest: null,
      mapId: "map", mapDigest: "map-digest", contentDigest: "content", configVersion: "config", profileVersion: "profile",
      archetypeVersion: "archetype", difficulty: "normal", faction: FactionType.Tivara, playerNumber: 2,
      rulesVersion: "rules", tickInterval: 50, authorityEpoch: 1, tick: 20,
      snapshotReference: "snapshots/original.json", snapshotDigest: digestAiReproJson(payload),
      inputReference: "inputs/original.json", inputDigest: digestAiReproJson({ observation: {}, outcomes: [] }),
      expectedCheckpoints: [], scenarioId: "DBG-05" } }, payload };
}

it("accepts intact host-local data without applying it or changing the original", () => {
  const json = JSON.stringify(artifact());
  expect(parseAiRuntimeArtifact(json, "host").manifest.display.label).toBe("Original incident");
  expect(JSON.stringify(artifact())).toBe(json);
});

it("denies a player before parsing confidential bytes", () => {
  expect(() => parseAiRuntimeArtifact("malformed", "player")).toThrow("access_denied");
});

it("rejects malformed, traversal, markup, schema and payload tampering", () => {
  expect(() => parseAiRuntimeArtifact("{", "host")).toThrow("malformed_json");
  for (const [code, mutate] of [
    ["unsafe_reference", (value: ReturnType<typeof artifact>) => { value.manifest.replayInputs.snapshotReference = "../hidden"; }],
    ["unsafe_label", (value: ReturnType<typeof artifact>) => { value.manifest.display.label = "<img src=x onerror=alert(1)>"; }],
    ["unsupported_version", (value: ReturnType<typeof artifact>) => { value.manifest.schemaVersion = 2; }],
    ["malformed_bundle", (value: ReturnType<typeof artifact>) => { value.payload.observation = { changed: true }; }]
  ] as const) {
    const value = artifact();
    mutate(value);
    expect(() => parseAiRuntimeArtifact(JSON.stringify(value), "host")).toThrow(code);
  }
});

it("bounds structural counts and nesting before recursive manifest inspection", () => {
  const value = artifact();
  const oversized = { ...value, payload: { ...value.payload, outcomes: Array.from({ length: 4097 }, () => null) } };
  expect(() => parseAiRuntimeArtifact(JSON.stringify(oversized), "host")).toThrow("oversized");
  let deep: unknown = null;
  for (let level = 0; level < 50; level++) deep = { nested: deep };
  expect(() => parseAiRuntimeArtifact(JSON.stringify({ ...value, extra: deep }), "host")).toThrow("oversized");
});
