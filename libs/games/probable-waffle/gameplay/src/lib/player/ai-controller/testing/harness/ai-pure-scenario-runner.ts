import type { AiBrain } from "../../brain/ai-brain";
import {
  canonicalizeAiBrainState,
  digestCanonicalAiValue,
  serializeCanonicalAiValue
} from "../../brain/persistence/canonical-ai-serialization";
import { buildAiScenario } from "./ai-scenario-builder";
import { evaluateAiScenarioAssertion, type AiScenarioOracleFacts } from "./ai-scenario-oracle";
import type { AiScenarioRunReport, AiScenario } from "./ai-scenario";
import type { AiIntent } from "../../contracts/commands/ai-intent";
import type { AiScenarioDecisionRecord } from "./ai-scenario";

/** Executes the pure decision boundary with no clock, Phaser, filesystem or random side effects. */
export function runPureAiScenario(
  scenarioInput: AiScenario,
  brain: AiBrain,
  provenance: { readonly sourceRevision: string; readonly worldDigest?: string }
): AiScenarioRunReport {
  const scenario = buildAiScenario(scenarioInput);
  let state = scenario.initialState;
  const accepted: AiIntent[] = [];
  const records: AiScenarioDecisionRecord[] = [];
  for (const frame of scenario.frames) {
    const previousAiDigest = digestCanonicalAiValue(state);
    const result = brain.step(frame.observation, state, frame.outcomes);
    state = canonicalizeAiBrainState(result.nextState);
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
  const facts: AiScenarioOracleFacts = {
    intents: accepted,
    state,
    world: {},
    digests: { command: digestCanonicalAiValue(accepted), ai: finalAiDigest, world: finalWorldDigest ?? "missing" },
    workCounts: { decisions: records.length },
    appliedCommands: []
  };
  const nonVacuityFailures = scenario.nonVacuity
    .map((assertion) => evaluateAiScenarioAssertion(assertion, facts))
    .filter((failure): failure is string => failure !== null);
  const assertionResults = scenario.expectedBranches.map((branch) => {
    const positive = branch.assertions
      .map((assertion) => evaluateAiScenarioAssertion(assertion, facts))
      .filter((failure): failure is string => failure !== null);
    const forbidden = branch.forbidden
      .filter((assertion) => evaluateAiScenarioAssertion(assertion, facts) === null)
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
