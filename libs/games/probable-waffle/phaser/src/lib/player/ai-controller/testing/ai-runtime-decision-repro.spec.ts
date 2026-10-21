import Phaser from "phaser";
import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiTestObservation } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { createAiBrainStateV1 } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import { publishAiRuntimeDecisionRepro, type AiRuntimeDecisionRepro } from "./ai-runtime-decision-repro";

/** Diagnostic-only publisher controls, separate from native scenario evidence. */
describe("native decision reproduction publisher", () => {
  it("detaches actual consumed input only when observed, and a broken observer cannot prevent native dispatch", () => {
    const events = new Phaser.Events.EventEmitter(), scene = { events } as unknown as Phaser.Scene;
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const observation = createAiTestObservation();
    const prior = createAiBrainStateV1({ profile, faction: FactionType.Tivara, playerNumber: 1, tick: 0,
      archetypeId: "opening:1:balanced" });
    const catalog = { schemaVersion: 1 as const, generation: observation.generation, entries: [], unsupported: [] };
    publishAiRuntimeDecisionRepro(scene, undefined, undefined, observation, prior, [], undefined);
    const observed: AiRuntimeDecisionRepro[] = [];
    events.once("ai-runtime-decision-repro", (value: AiRuntimeDecisionRepro) => observed.push(value));
    publishAiRuntimeDecisionRepro(scene, profile, catalog, observation, prior, [], undefined);
    expect(observed[0]?.payload.observation).toEqual(observation);
    expect(observed[0]?.payload.observation).not.toBe(observation);
    expect(observed[0]?.payload.priorState).toEqual(prior);
    expect(observed[0]?.payload.priorState).not.toBe(prior);
    events.once("ai-runtime-decision-repro", () => { throw new Error("broken optional observer"); });
    expect(() => publishAiRuntimeDecisionRepro(scene, profile, catalog, observation, prior, [], undefined)).not.toThrow();
  });
});
