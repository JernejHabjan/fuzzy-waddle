import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import { proposeAiOpening } from "../planning/ai-opening-proposal";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "./ai-test-fixtures";

const openings = [
  { faction: FactionType.Tivara, core: ObjectNames.Sandhold, worker: ObjectNames.TivaraWorker },
  { faction: FactionType.Skaduwee, core: ObjectNames.FrostForge, worker: ObjectNames.SkaduweeWorker }
] as const;

function openingWorld(
  opening: (typeof openings)[number],
  workers: number,
  queuedWorker: boolean
): { observation: AiObservationV1; catalog: AiCapabilityCatalogV1 } {
  const base = createAiTestObservation();
  const core = {
    ...createAiTestOwnedActor("core"),
    objectName: opening.core,
    mainBuilding: { status: "known" as const, value: true, observedTick: 20 },
    queue: {
      status: "known" as const,
      observedTick: 20,
      value: {
        capacity: 1,
        occupied: queuedWorker ? 1 : 0,
        itemIds: queuedWorker ? ["core:worker-queue"] : [],
        items: queuedWorker
          ? [
              {
                itemId: "core:worker-queue",
                kind: "production" as const,
                objectName: opening.worker,
                researchType: null
              }
            ]
          : []
      }
    }
  };
  const workerActors = Array.from({ length: workers }, (_, index) => ({
    ...createAiTestOwnedActor(`worker-${index}`),
    objectName: opening.worker
  }));
  const observation: AiObservationV1 = {
    ...base,
    faction: opening.faction,
    actors: [core, ...workerActors],
    resources: Object.values(ResourceType).map((resourceType) => ({
      resourceType,
      stockpile: 200,
      reservedUnspent: 0,
      obligationsDue: 0,
      deliveredIncomePerMinute: { status: "known" as const, value: 0, observedTick: 20 }
    }))
  };
  const catalog: AiCapabilityCatalogV1 = {
    schemaVersion: 1,
    generation: observation.generation,
    unsupported: [],
    entries: [
      {
        capabilityId: `${opening.core}:producer`,
        family: "produce",
        sourceObjectName: opening.core,
        effectiveLevel: 1,
        movementDomains: [],
        targetDomains: [],
        produces: [opening.worker],
        constructs: [],
        researches: [],
        gathers: [],
        housingCapacity: 10,
        housingCost: null,
        cargoCapacity: null
      },
      {
        capabilityId: `${opening.worker}:gather`,
        family: "gather",
        sourceObjectName: opening.worker,
        effectiveLevel: 1,
        movementDomains: ["ground"],
        targetDomains: [],
        produces: [],
        constructs: [],
        researches: [],
        gathers: [ResourceType.Food, ResourceType.Wood],
        housingCapacity: null,
        housingCost: 1,
        cargoCapacity: null,
        constructionProfile: {
          resourceCost: { [ResourceType.Food]: 50 },
          footprintRadiusTiles: 0,
          visionRange: 4,
          navigableHeight: null,
          enterHeight: null,
          exitHeight: null
        }
      }
    ]
  };
  return { observation, catalog };
}

function openingProposal(opening: (typeof openings)[number], workers: number, queuedWorker: boolean) {
  const { observation, catalog } = openingWorld(opening, workers, queuedWorker);
  const state = createAiBrainStateV1({
    playerNumber: 1,
    faction: opening.faction,
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium),
    tick: observation.tick,
    archetypeId: "balanced"
  });
  return proposeAiOpening(observation, state, catalog);
}

describe("ECO-08 deterministic two-faction bootstrap", () => {
  for (const opening of openings) {
    it(`${opening.faction}: produces a catalog-priced first worker from exactly 200 resources`, () => {
      const runs = Array.from({ length: 3 }, () => openingProposal(opening, 0, false));
      expect(new Set(runs.map(digestCanonicalAiValue)).size).toBe(1);
      const proposal = runs[0]!;
      expect(proposal.activeCheckpointId).toBe("bootstrap-worker");
      expect(proposal.demands[0]).toMatchObject({ desired: 2, satisfiedActorIds: [], queuedIds: [] });
      const workerIntent = proposal.intents.find((intent) => intent.kind === "produce");
      expect(workerIntent).toMatchObject({ kind: "produce", producerId: "core", objectName: opening.worker });
      expect(workerIntent?.claims).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: "resource", resourceType: ResourceType.Food, amount: 50 })
        ])
      );
    });

    it(`${opening.faction}: counts queued work once and retires the two-worker opening gate`, () => {
      const queued = openingProposal(opening, 1, true);
      expect(queued.demands[0]).toMatchObject({
        desired: 2,
        satisfiedActorIds: ["worker-0"],
        queuedIds: ["core:worker-queue"]
      });
      expect(queued.intents.some((intent) => intent.kind === "produce" && intent.objectName === opening.worker)).toBe(
        false
      );

      const completed = openingProposal(opening, 2, false);
      expect(completed.steps[0]).toMatchObject({ stepId: "step:opening:bootstrap-worker", state: "completed" });
      expect(completed.activeCheckpointId).toBe("supply-safety");
      expect(
        completed.intents.some((intent) => intent.kind === "produce" && intent.objectName === opening.worker)
      ).toBe(false);
    });
  }
});
