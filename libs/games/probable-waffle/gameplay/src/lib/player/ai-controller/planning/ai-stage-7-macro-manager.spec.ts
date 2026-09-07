import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { createStage2Observation } from "../testing/ai-stage-2-test-fixtures";
import { AiStage7MacroManagerV1 } from "./ai-stage-7-macro-manager";

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    { capabilityId: "worker", family: "worker", sourceObjectName: ObjectNames.TivaraWorker, effectiveLevel: 1, movementDomains: ["ground"], targetDomains: [], produces: [], constructs: [ObjectNames.Olival, ObjectNames.AnkGuard, ObjectNames.Granary], researches: [], gathers: [], housingCapacity: null, housingCost: 1, cargoCapacity: null },
    { capabilityId: "main", family: "producer", sourceObjectName: ObjectNames.Sandhold, effectiveLevel: 1, movementDomains: [], targetDomains: [], produces: [ObjectNames.TivaraWorker], constructs: [], researches: [], gathers: [], housingCapacity: null, housingCost: null, cargoCapacity: null },
    { capabilityId: "house", family: "housing", sourceObjectName: ObjectNames.Olival, effectiveLevel: 1, movementDomains: [], targetDomains: [], produces: [], constructs: [], researches: [], gathers: [], housingCapacity: 8, housingCost: null, cargoCapacity: null }
  ]
};

describe("AiStage7MacroManagerV1", () => {
  it("keeps bootstrap demand stable and proposes the legal missing worker", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" });
    const observation = { ...createStage2Observation(), actors: [{ ...createStage2Observation().actors[0], objectName: ObjectNames.Sandhold, housingCost: { status: "known" as const, value: 0, observedTick: 20 } }] };
    const proposal = new AiStage7MacroManagerV1(() => catalog).propose(observation, state);

    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "produce", objectName: ObjectNames.TivaraWorker }));
    expect(proposal.statePatch?.economyProduction?.demands.find((demand) => demand.purpose === "bootstrap_worker")?.desired).toBe(1);
  });

  it("does not request housing when the committed supply buffer already exists", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" });
    const observation = { ...createStage2Observation(), actors: [{ ...createStage2Observation().actors[0], housingCapacity: { status: "known" as const, value: 8, observedTick: 20 } }] };
    const proposal = new AiStage7MacroManagerV1(() => catalog).propose(observation, state);

    expect(proposal.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Olival)).toBe(false);
  });
});
