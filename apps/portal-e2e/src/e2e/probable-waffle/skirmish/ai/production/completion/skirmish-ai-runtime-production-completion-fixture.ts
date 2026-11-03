import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import type { AiRuntimeQueueCompletion } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/queues/ai-runtime-queue-completion";
import type { AiRuntimeCreatedActor } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/harness/capture/ai-runtime-created-actor";
import { productionQueueMutationFixture } from "../queues/skirmish-ai-runtime-production-queue-mutation-fixture";
import { researchCompletionRemovalFixture } from "../ownership/skirmish-ai-runtime-research-completion-fixture";

/** Synthetic exact-authority shapes only; no live creator, setup, definitions, strategic utility or runtime coverage. */
export function productionCompletionFixture(family: "production" | "research" = "production", terminalTick = 10) {
  const source = family === "production" ? productionQueueMutationFixture("completion") : researchCompletionRemovalFixture();
  const removal = source.facts.find((fact) => fact.kind === "queue_mutation" &&
    fact.mutation.operation === "complete_remove" && fact.mutation.phase === "after");
  const terminal = source.facts.find((fact) => fact.kind === "outcome" && fact.outcome.kind === "completed");
  if (!removal || removal.kind !== "queue_mutation" || !terminal || terminal.kind !== "outcome" ||
    !removal.mutation.item || !removal.mutation.originatingCommandContext) throw new Error("synthetic_completion_removal_missing");
  const actor = { actorId: "synthetic-created-actor", objectName: ObjectNames.TivaraWorkerMale,
    canonicalObjectName: ObjectNames.TivaraWorker, playerNumber: 1, active: true, alive: true,
    finished: true, indexed: true } satisfies AiRuntimeCreatedActor;
  const before = { completionId: 1, phase: "before", actorId: "producer", item: removal.mutation.item,
    originatingCommandContext: removal.mutation.originatingCommandContext, createdActor: null, createdActorInProducerScene: null,
    requestedCanonicalObjectName: family === "production" ? ObjectNames.TivaraWorker : null,
    researchRegistered: family === "research" ? false : null, snapshotRestoreInProgress: false, gaps: []
  } satisfies AiRuntimeQueueCompletion;
  const after: AiRuntimeQueueCompletion = { ...before, phase: "after", createdActor: family === "production" ? actor : null,
    createdActorInProducerScene: family === "production" ? true : null, researchRegistered: family === "research" ? true : null };
  const base = { sequence: 0, tick: 10, playerNumber: 1, boundaryState: removal.boundaryState };
  const researchType = removal.mutation.item.researchType;
  if (family === "research" && !researchType) throw new Error("synthetic_completion_tech_missing");
  const registration: AiRuntimeProductionFact = researchType ? { ...base, kind: "research_completed", researchType } : {
    ...base, kind: "actor_registered", actor, snapshotRestoreInProgress: false
  };
  const facts: AiRuntimeProductionFact[] = source.facts.flatMap((fact) => fact === terminal ? [
    { ...base, kind: "queue_completion", completion: before }, registration,
    { ...base, kind: "queue_completion", completion: after },
    { ...terminal, tick: terminalTick, outcome: { ...terminal.outcome, tick: terminalTick } }
  ] : [fact]);
  return { ...source, facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) };
}
