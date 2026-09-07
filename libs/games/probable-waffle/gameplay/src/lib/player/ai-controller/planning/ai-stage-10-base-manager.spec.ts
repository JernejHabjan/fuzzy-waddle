import { FactionType, ObjectNames, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createStage2Observation, createStage2OwnedActor } from "../testing/ai-stage-2-test-fixtures";
import { AI_STAGE_10_EXPANSION_SATURATION_TICKS, AiStage10BaseManagerV1 } from "./ai-stage-10-base-manager";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [{
    capabilityId: "worker", family: "worker", sourceObjectName: ObjectNames.TivaraWorker, effectiveLevel: 1,
    movementDomains: ["ground"], targetDomains: [], produces: [], constructs: [ObjectNames.Sandhold], researches: [], gathers: [],
    housingCapacity: null, housingCost: 1, cargoCapacity: null
  }]
};

function actor(actorId: string, objectName: ObjectNames, x: number, main = false): AiObservedActorV1 {
  return {
    ...createStage2OwnedActor(actorId),
    objectName,
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 0 },
    accessNodeId: { status: "known", value: `access:${x},0`, observedTick: 0 },
    mainBuilding: { status: "known", value: main, observedTick: 0 }
  };
}

function observation(tick: number, actors: readonly AiObservedActorV1[], deliveredIncome = 5): AiObservationV1 {
  return {
    ...createStage2Observation(),
    tick,
    generation: 1,
    actors,
    resources: [{ resourceType: ResourceType.Wood, stockpile: 500, reservedUnspent: 0, obligationsDue: 0, deliveredIncomePerMinute: { status: "known", value: deliveredIncome, observedTick: tick } }]
  };
}

describe("AiStage10BaseManagerV1", () => {
  const manager = new AiStage10BaseManagerV1(profile, () => catalog);

  it("anchors the base to the main structure rather than moving it with a distant scout", () => {
    const state = createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" });
    const proposal = manager.propose(observation(20, [actor("sandhold", ObjectNames.Sandhold, 4, true), actor("scout", ObjectNames.TivaraWorker, 400)]), state);

    expect(proposal.statePatch?.bases).toContainEqual(expect.objectContaining({ baseId: "base:main:sandhold", anchorActorId: "sandhold", memberActorIds: ["sandhold"] }));
  });

  it("creates one stable expansion reservation from a visible distant resource instead of duplicate same-tick plans", () => {
    const state = createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" });
    const distantResource = {
      ...actor("wood-remote", ObjectNames.Tree1, 50), owner: null, relation: "neutral" as const, visibility: "visible" as const,
      resourceState: { status: "known" as const, value: { resourceType: ResourceType.Wood, available: { status: "known" as const, value: 200, observedTick: AI_STAGE_10_EXPANSION_SATURATION_TICKS }, carried: { status: "unknown" as const, reason: "not_supported" as const }, growthReadyTick: { status: "unknown" as const, reason: "not_supported" as const }, serviceCapacity: { status: "known" as const, value: 4, observedTick: AI_STAGE_10_EXPANSION_SATURATION_TICKS } }, observedTick: AI_STAGE_10_EXPANSION_SATURATION_TICKS }
    } satisfies AiObservedActorV1;
    const first = manager.propose(observation(AI_STAGE_10_EXPANSION_SATURATION_TICKS, [actor("sandhold", ObjectNames.Sandhold, 4, true), actor("worker", ObjectNames.TivaraWorker, 5), distantResource], 0), state);
    const second = manager.propose(observation(AI_STAGE_10_EXPANSION_SATURATION_TICKS + 20, [actor("sandhold", ObjectNames.Sandhold, 4, true), actor("worker", ObjectNames.TivaraWorker, 5), distantResource], 0), { ...state, bases: first.statePatch!.bases! });

    expect(first.statePatch?.bases.filter((base) => base.baseId.startsWith("base:expansion:"))).toHaveLength(1);
    expect(second.statePatch?.bases.filter((base) => base.baseId.startsWith("base:expansion:"))).toHaveLength(1);
  });
});
