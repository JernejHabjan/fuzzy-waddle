import { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import { AI_REPRO_CAPTURE_POLICY, type AiReproBundle } from "../contracts/ai-repro-bundle";
import { AiReproBundleValidationError, parseAiReproBundle } from "./parse-ai-repro-bundle";

const validBundle = {
  schemaVersion: 1,
  kind: "decision",
  replayInputs: {
    sourceRevision: "abc123",
    dirtySourceDigest: null,
    mapId: "map-1",
    mapDigest: "sha256:map",
    contentDigest: "sha256:content",
    configVersion: "config",
    profileVersion: "skirmish-ai",
    archetypeVersion: "opening-archetypes",
    difficulty: "normal",
    faction: FactionType.Tivara,
    playerNumber: 1,
    rulesVersion: "rules",
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
} satisfies AiReproBundle;

describe("parseAiReproBundle / DBG-05", () => {
  it("accepts a bounded permitted decision manifest", () => {
    expect(parseAiReproBundle(JSON.stringify(validBundle), { access: "player" })).toEqual(validBundle);
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
    expect(() => parseAiReproBundle(json, { access: "developer" })).toThrow(new AiReproBundleValidationError(code));
  });

  it("rejects oversized input before JSON parsing", () => {
    expect(() => parseAiReproBundle(JSON.stringify(validBundle), { access: "developer", maxBytes: 8 })).toThrow(
      new AiReproBundleValidationError("oversized")
    );
  });

  it("keeps runtime captures host/developer-only", () => {
    const runtime = { ...validBundle, kind: "runtime", privacy: "host_confidential" } as const;
    expect(() => parseAiReproBundle(JSON.stringify(runtime), { access: "player" })).toThrow(
      new AiReproBundleValidationError("access_denied")
    );
    expect(parseAiReproBundle(JSON.stringify(runtime), { access: "host" }).kind).toBe("runtime");
  });

  it("publishes the bounded automatic capture policy", () => {
    expect(AI_REPRO_CAPTURE_POLICY).toEqual({
      automaticCapturesPerCausalEpisode: 1,
      maxRetainedIncidentBundles: 5,
      sessionQuotaBytes: 64 * 1024 * 1024
    });
  });
});
