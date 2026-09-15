import type { AiBrainV1 } from "../brain/ai-brain";
import {
  canonicalizeAiBrainStateV1,
  digestCanonicalAiValue,
  serializeCanonicalAiValue
} from "../brain/canonical-ai-serialization";
import { buildAiScenarioV1 } from "./ai-scenario-builder-v1";
import { evaluateAiScenarioAssertionV1, type AiScenarioOracleFactsV1 } from "./ai-scenario-oracle-v1";
import type { AiScenarioRunReportV1, AiScenarioV1 } from "./ai-scenario-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiScenarioDecisionRecordV1 } from "./ai-scenario-v1";

/** Executes the pure decision boundary with no clock, Phaser, filesystem or random side effects. */
export function runPureAiScenarioV1(
  scenarioInput: AiScenarioV1,
  brain: AiBrainV1,
  provenance: { readonly sourceRevision: string; readonly worldDigest?: string }
): AiScenarioRunReportV1 {
  const scenario = buildAiScenarioV1(scenarioInput);
  let state = scenario.initialState;
  const accepted: AiIntentV1[] = [];
  const records: AiScenarioDecisionRecordV1[] = [];
  for (const frame of scenario.frames) {
    const previousAiDigest = digestCanonicalAiValue(state);
    const result = brain.step(frame.observation, state, frame.outcomes);
    state = canonicalizeAiBrainStateV1(result.nextState);
    accepted.push(...result.acceptedIntents);
    records.push({
      tick: frame.observation.tick,
      acceptedIntentIds: result.acceptedIntents.map((intent) => intent.intentId),
      acceptedIntents: structuredClone(result.acceptedIntents),
      trace: structuredClone(result.trace),
      commandDigest: digestCanonicalAiValue(result.acceptedIntents),
      previousAiDigest,
      aiDigest: digestCanonicalAiValue(state),
      traceDigest: digestCanonicalAiValue(result.trace),
      workCounts: { decisions: result.decisions.length, intents: result.acceptedIntents.length },
      diagnosticState: { ai: state, commands: result.acceptedIntents }
    });
  }
  const finalAiDigest = digestCanonicalAiValue(state);
  const finalWorldDigest = provenance.worldDigest ?? null;
  const facts: AiScenarioOracleFactsV1 = {
    intents: accepted,
    state,
    world: {},
    digests: { command: digestCanonicalAiValue(accepted), ai: finalAiDigest, world: finalWorldDigest ?? "missing" },
    workCounts: { decisions: records.length },
    appliedCommands: []
  };
  const nonVacuityFailures = scenario.nonVacuity
    .map((assertion) => evaluateAiScenarioAssertionV1(assertion, facts))
    .filter((failure): failure is string => failure !== null);
  const assertionResults = scenario.expectedBranches.map((branch) => {
    const positive = branch.assertions
      .map((assertion) => evaluateAiScenarioAssertionV1(assertion, facts))
      .filter((failure): failure is string => failure !== null);
    const forbidden = branch.forbidden
      .filter((assertion) => evaluateAiScenarioAssertionV1(assertion, facts) === null)
      .map((assertion) => `forbidden_satisfied:${assertion.kind}`);
    const failures = [...nonVacuityFailures.map((failure) => `non_vacuity:${failure}`), ...positive, ...forbidden];
    return { branchId: branch.branchId, passed: failures.length === 0, failures };
  });
  return {
    schemaVersion: 1,
    scenarioId: scenario.scenarioId,
    driver: "pure",
    seed: scenario.seed,
    sourceRevision: provenance.sourceRevision,
    fixtureDigest: digestCanonicalAiValue(JSON.parse(serializeCanonicalAiValue(scenario))),
    records,
    finalAiDigest,
    finalWorldDigest,
    assertionResults
  };
}
