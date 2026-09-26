import { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import { AI_REPRO_CAPTURE_POLICY_V1, type AiReproBundleV1 } from "../contracts/ai-repro-bundle-v1";
import { AiReproBundleValidationError, parseAiReproBundleV1 } from "./parse-ai-repro-bundle";

const validBundle = {
  schemaVersion: 1,
  kind: "decision",
  replayInputs: {
    sourceRevision: "abc123",
    dirtySourceDigest: null,
    mapId: "map-1",
    mapDigest: "sha256:map",
    contentDigest: "sha256:content",
    configVersion: "config-v1",
    profileVersion: "skirmish-ai-v1",
    archetypeVersion: "opening-archetypes-v1",
    difficulty: "normal",
    faction: FactionType.Tivara,
    playerNumber: 1,
    rulesVersion: "rules-v1",
    tickInterval: 20,
    authorityEpoch: 1,
    tick: 200,
    snapshotReference: "snapshots/decision-200.json",
    snapshotDigest: "sha256:snapshot",
    inputReference: "inputs/decision-200.json",
    inputDigest: "sha256:input",
    expectedCheckpoints: [{ tick: 200, digest: "sha256:checkpoint" }],
    scenarioId: "DBG-05"
  },
  completeness: {
    observation: "complete",
    priorState: "complete",
    outcomes: "complete",
    alternatives: "not_recorded",
    missingRanges: [],
    truncatedEventCount: 0
  },
  privacy: "permitted_player_data",
  display: { label: "Decision 200" }
} satisfies AiReproBundleV1;

describe("parseAiReproBundleV1 / DBG-05", () => {
  it("accepts a bounded permitted decision manifest", () => {
    expect(parseAiReproBundleV1(JSON.stringify(validBundle), { access: "player" })).toEqual(validBundle);
  });

  it.each([
    ["malformed_json", "{"],
    ["unsupported_version", JSON.stringify({ ...validBundle, schemaVersion: 2 })],
    [
      "unsafe_reference",
      JSON.stringify({
        ...validBundle,
        replayInputs: { ...validBundle.replayInputs, inputReference: "../secret.json" }
      })
    ],
    ["unsafe_label", JSON.stringify({ ...validBundle, display: { label: "<img onerror=alert(1)>" } })]
  ] as const)("rejects %s input", (code, json) => {
    expect(() => parseAiReproBundleV1(json, { access: "developer" })).toThrow(new AiReproBundleValidationError(code));
  });

  it("rejects oversized input before JSON parsing", () => {
    expect(() => parseAiReproBundleV1(JSON.stringify(validBundle), { access: "developer", maxBytes: 8 })).toThrow(
      new AiReproBundleValidationError("oversized")
    );
  });

  it("keeps runtime captures host/developer-only", () => {
    const runtime = { ...validBundle, kind: "runtime", privacy: "host_confidential" } as const;
    expect(() => parseAiReproBundleV1(JSON.stringify(runtime), { access: "player" })).toThrow(
      new AiReproBundleValidationError("access_denied")
    );
    expect(parseAiReproBundleV1(JSON.stringify(runtime), { access: "host" }).kind).toBe("runtime");
  });

  it("publishes the bounded automatic capture policy", () => {
    expect(AI_REPRO_CAPTURE_POLICY_V1).toEqual({
      automaticCapturesPerCausalEpisode: 1,
      maxRetainedIncidentBundles: 5,
      sessionQuotaBytes: 64 * 1024 * 1024
    });
  });
});
