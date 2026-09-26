import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { advanceAiSkirmishDefense } from "./ai-skirmish-defense";
import { createAiSkirmishProposalContext } from "./ai-skirmish-proposal-draft";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const catalog: AiCapabilityCatalogV1 = { schemaVersion: 1, generation: 1, entries: [], unsupported: [] };

function combatant(id: string, relation: "self" | "enemy", x: number): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(id),
    objectName: ObjectNames.TivaraMacemanMale,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 20 },
    capabilities: [
      {
        id: `${id}:attack`,
        family: "attack",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 20 }
      }
    ],
    housingCost: { status: "known", value: 1, observedTick: 20 }
  };
}

function defendersFor(raiderCount: number): number {
  const home: AiObservedActorV1 = {
    ...createAiTestOwnedActor("main"),
    objectName: ObjectNames.Sandhold,
    mainBuilding: { status: "known", value: true, observedTick: 20 },
    housingCost: { status: "known", value: 0, observedTick: 20 },
    logicalPosition: { status: "known", value: { x: 0, y: 0, z: 0 }, observedTick: 20 }
  };
  const defenders = Array.from({ length: 8 }, (_, index) => combatant(`guard-${index}`, "self", 1));
  const raiders = Array.from({ length: raiderCount }, (_, index) => combatant(`raider-${index}`, "enemy", 3 + index));
  const observation = { ...createAiTestObservation(), actors: [home, ...defenders, ...raiders] };
  const state = createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
  const context = createAiSkirmishProposalContext(observation, state, catalog);
  advanceAiSkirmishDefense(context);
  return context.nextSquads.find((squad) => squad.role === "defense")?.actorIds.length ?? 0;
}

describe("AI local defense sizing", () => {
  it("uses a bounded pair of defenders against one mobile home raider", () => {
    expect(defendersFor(1)).toBe(2);
  });

  it("scales defense to visible multi-unit home pressure instead of recalling only a quarter of the army", () => {
    expect(defendersFor(3)).toBe(6);
  });
});
