import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { PureAiBrain } from "../brain/ai-brain";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation } from "./ai-test-fixtures";
import {
  AiOfflineDecisionStepperV1,
  captureAiDecisionBundleV1,
  compareAiDecisionBundlesV1,
  replayAiDecisionBundleV1,
  runAiOfflineWhatIfV1,
  type AiDecisionReproArtifactV1
} from "./ai-repro-runner-v1";
import { readFileSync } from "node:fs";
import { parseAiReproBundleV1 } from "../debug/parse-ai-repro-bundle";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const priorState = createAiBrainStateV1({
  playerNumber: 1,
  faction: FactionType.Tivara,
  profile,
  tick: 20,
  archetypeId: "opening:test"
});

function artifact(sourceRevision = "source-a"): AiDecisionReproArtifactV1 {
  return captureAiDecisionBundleV1(
    { observation: createAiTestObservation(), priorState, outcomes: [] },
    {
      sourceRevision,
      dirtySourceDigest: null,
      mapId: "test-map",
      mapDigest: "map:1",
      contentDigest: "content:1",
      configVersion: "config:1",
      profileVersion: profile.profileVersion,
      archetypeVersion: profile.archetypeVersion,
      difficulty: "normal",
      faction: FactionType.Tivara,
      playerNumber: 1,
      rulesVersion: "rules:1",
      tickInterval: 50,
      authorityEpoch: 0,
      tick: 20,
      expectedCheckpoints: [],
      scenarioId: "DBG-03"
    },
    "fixture"
  );
}

describe("Stage 5 reproduction runner / DBG-01,03,04,05", () => {
  const brain = new PureAiBrain(profile, []);

  it("blocks incomplete history and incompatible source instead of claiming exact replay", () => {
    const incomplete = artifact();
    const replay = replayAiDecisionBundleV1(
      {
        ...incomplete,
        manifest: {
          ...incomplete.manifest,
          completeness: { ...incomplete.manifest.completeness, outcomes: "missing" }
        }
      },
      brain,
      {
        sourceRevision: "source-a",
        configVersion: "config:1",
        mapDigest: "map:1",
        contentDigest: "content:1",
        rulesVersion: "rules:1"
      }
    );
    expect(replay).toEqual({ status: "blocked", blocker: "missing_outcome_history" });
    expect(
      replayAiDecisionBundleV1(artifact(), brain, {
        sourceRevision: "source-b",
        configVersion: "config:1",
        mapDigest: "map:1",
        contentDigest: "content:1",
        rulesVersion: "rules:1"
      })
    ).toEqual({
      status: "blocked",
      blocker: "incompatible_source"
    });
  });

  it("labels changed provenance separately from same-input divergence", () => {
    expect(compareAiDecisionBundlesV1(artifact("source-a"), artifact("source-b")).classification).toBe("changed_input");
    const original = artifact();
    const candidate = {
      ...artifact(),
      payload: {
        ...artifact().payload,
        expectedResult: brain.step(createAiTestObservation(), priorState, [])
      }
    };
    expect(compareAiDecisionBundlesV1(original, candidate).classification).toBe("same_input_divergence");
  });

  it("steps an isolated decision once and stops on a named safe boundary", () => {
    const stepper = new AiOfflineDecisionStepperV1(artifact(), brain);
    expect(stepper.stepDecision("decision_complete").status).toBe("breakpoint");
    expect(stepper.stepDecision().status).toBe("exhausted");
  });

  it("DBG-04 runs a pure what-if without mutating the captured observation, state or RNG", () => {
    const original = artifact();
    const before = JSON.stringify(original);
    const result = runAiOfflineWhatIfV1(original, brain, {
      ...original.payload,
      observation: { ...original.payload.observation, tick: original.payload.observation.tick + 1 }
    });
    expect(result.classification).toBe("counterfactual_divergence");
    expect(JSON.stringify(original)).toBe(before);
  });

  it("executes a CLI-requested pure artifact through the same validated replay boundary", () => {
    const rawRequest = process.env.AI_SKIRMISH_MATRIX_REQUEST;
    if (!rawRequest) return;
    const request = JSON.parse(rawRequest) as { suite?: string; replayArtifactPath?: string | null };
    if (request.suite !== "replay" || !request.replayArtifactPath) return;
    const rawArtifact = JSON.parse(readFileSync(request.replayArtifactPath, "utf8")) as AiDecisionReproArtifactV1;
    parseAiReproBundleV1(JSON.stringify(rawArtifact.manifest), { access: "developer" });
    const replay = replayAiDecisionBundleV1(rawArtifact, brain, {
      sourceRevision: rawArtifact.manifest.replayInputs.sourceRevision,
      configVersion: rawArtifact.manifest.replayInputs.configVersion,
      mapDigest: rawArtifact.manifest.replayInputs.mapDigest,
      contentDigest: rawArtifact.manifest.replayInputs.contentDigest,
      rulesVersion: rawArtifact.manifest.replayInputs.rulesVersion
    });
    expect(replay.status).toBe("reproduced");
  });
});
