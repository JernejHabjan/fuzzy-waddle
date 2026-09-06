import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import { FactionType, ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";

/** Creates an explicit unknown value for Stage 2 pure fixtures. */
export const unknownAiValue = { status: "unknown", reason: "not_observed" } as const;

/** Creates a fully shaped owned actor without inventing unavailable capability values. */
export function createStage2OwnedActor(actorId: ActorId): AiObservedActorV1 {
  return {
    actorId,
    objectName: ObjectNames.TivaraWorker,
    owner: 1,
    relation: "self",
    visibility: "owned",
    evidenceId: `evidence:${actorId}`,
    observedTick: 20,
    logicalPosition: { status: "known", value: { x: 4, y: 5, z: 0 }, observedTick: 20 },
    accessNodeId: { status: "known", value: "access:main", observedTick: 20 },
    effectiveLevel: { status: "known", value: 1, observedTick: 20 },
    capabilities: [],
    queue: unknownAiValue,
    cost: unknownAiValue,
    housingCost: { status: "known", value: 1, observedTick: 20 },
    housingCapacity: unknownAiValue,
    resourceState: unknownAiValue,
    activeEffectIds: []
  };
}

/** Creates a canonical Stage 2 observation with one worker and a wood budget. */
export function createStage2Observation(): AiObservationV1 {
  return {
    schemaVersion: 1,
    generation: 1,
    tick: 20,
    playerNumber: 1,
    faction: FactionType.Tivara,
    actors: [createStage2OwnedActor("worker-1")],
    resources: [
      {
        resourceType: ResourceType.Wood,
        stockpile: 100,
        reservedUnspent: 10,
        obligationsDue: 20,
        deliveredIncomePerMinute: { status: "known", value: 30, observedTick: 20 }
      }
    ],
    accessProducts: [],
    effects: [],
    modeGoals: []
  };
}
