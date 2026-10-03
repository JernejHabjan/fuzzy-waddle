import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { AiMacroManager } from "./ai-macro-manager";

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "owlery",
      family: "producer",
      sourceObjectName: ObjectNames.Owlery,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [ObjectNames.SkaduweeOwl],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null
    },
    {
      capabilityId: "owl",
      family: "air_attack",
      sourceObjectName: ObjectNames.SkaduweeOwl,
      effectiveLevel: 1,
      movementDomains: ["air"],
      targetDomains: ["ground"],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Food]: 100, [ResourceType.Stone]: 40 },
        footprintRadiusTiles: 0,
        visionRange: 14,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    }
  ]
};

describe("AI macro domain pressure", () => {
  it("turns an observed air-access objective into an affordable air force instead of more blocked land troops", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Skaduwee,
      profile,
      tick: 200,
      archetypeId: "balanced",
      completedOpeningStepIds: [
        "step:opening:bootstrap-worker",
        "step:opening:supply-safety",
        "step:opening:first-producer",
        "step:opening:sustainable-food"
      ]
    });
    const state = {
      ...initial,
      strategy: {
        ...initial.strategy,
        assessment: {
          choice: "pressure" as const,
          reason: "air_route_to_enemy_base",
          targetActorId: "enemy-core",
          routeDomain: "air" as const,
          readyForce: 1,
          requiredForce: 8,
          visibleThreatCount: 0,
          confidencePermille: 1000,
          expectedEffectTick: 1000,
          reconsiderTick: 240,
          alternatives: []
        }
      }
    };
    const owlery = {
      ...createAiTestOwnedActor("owlery"),
      objectName: ObjectNames.Owlery,
      housingCost: { status: "known" as const, value: 0, observedTick: 200 },
      queue: {
        status: "known" as const,
        value: { capacity: 5, occupied: 0, itemIds: [], items: [] },
        observedTick: 200
      }
    };
    const owl = { ...createAiTestOwnedActor("owl"), objectName: ObjectNames.SkaduweeOwl };
    const observation = {
      ...createAiTestObservation(),
      tick: 200,
      faction: FactionType.Skaduwee,
      actors: [owlery, owl],
      resources: [ResourceType.Food, ResourceType.Stone, ResourceType.Wood].map((resourceType) => ({
        resourceType,
        stockpile: 2000,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: { status: "known" as const, value: 30, observedTick: 200 }
      }))
    };

    const proposal = new AiMacroManager(() => catalog).propose(observation, state);
    expect(proposal.statePatch?.economyProduction?.demands).toContainEqual(
      expect.objectContaining({ purpose: "dated_air_pressure", desired: 8 })
    );
    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "produce", objectName: ObjectNames.SkaduweeOwl })
    );
  });
});
