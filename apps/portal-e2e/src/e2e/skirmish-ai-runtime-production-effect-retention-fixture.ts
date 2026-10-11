import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { productionCompletionFixture } from "./skirmish-ai-runtime-production-completion-fixture";

/** Invented ordered post-completion samples. Sample presence supplies no continuous stability or strategic utility. */
export function productionEffectRetentionFixture(family: "production" | "research" = "production"):
  AiRuntimeProductionCaptureV1 {
  const source = productionCompletionFixture(family);
  const after = source.facts.find((fact) => fact.kind === "queue_completion" && fact.completion.phase === "after");
  const terminal = source.facts.find((fact) => fact.kind === "outcome" && fact.outcome.kind === "completed");
  if (!after || after.kind !== "queue_completion" || !terminal) throw new Error("synthetic_completed_effect_missing");
  const createdActor = after.completion.createdActor;
  const researchType = after.completion.item?.researchType;
  const actors = createdActor ? [{ ...createdActor, currentLevel: 1 }] : [];
  return { ...source, snapshots: [10, 20, 40].map((tick) => ({
    tick, afterSequence: terminal.sequence, observation: null, capabilityCatalog: null,
    ownedActors: actors.flatMap((actor) => actor.actorId ? [{ actorId: actor.actorId, objectName: actor.objectName }] : []),
    economyProduction: null, reservations: [], resources: { food: 100, wood: 100, stone: 100, minerals: 100 },
    pendingCommands: [], pendingResourceClaims: null, obligations: { food: 0, wood: 0, stone: 0, minerals: 0 },
    queues: [], completedResearch: researchType ? [researchType] : [],
    world: { snapshotRestoreInProgress: false, actors, catalog: [], gaps: [] }
  })) };
}
