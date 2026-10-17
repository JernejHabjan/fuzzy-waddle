import { runtimeProductionCaptureFailures } from "./skirmish-ai-runtime-production-capture-order";
import { normalizeRuntimeProductionWorldAuthority } from "./skirmish-ai-runtime-production-world-authority";
import { normalizeRuntimeProducerRoutes } from "./skirmish-ai-runtime-producer-route-normalization";
import { projectRuntimeProductionCancellations } from "./skirmish-ai-runtime-production-cancellations";
import { projectRuntimeProductionCompletions } from "./skirmish-ai-runtime-production-completions";
import { projectRuntimeProductionRejections } from "./skirmish-ai-runtime-production-rejections";
import { projectRuntimeProductionQueueMutations } from "./skirmish-ai-runtime-production-queue-mutations";
// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import { isRuntimeQueueCommand } from "./skirmish-ai-runtime-production-command-lineage";
import { normalizeRuntimeProductionCommands } from "./skirmish-ai-runtime-production-command-normalization";
import { normalizeRuntimeProductionPayments } from "./skirmish-ai-runtime-production-payments";

import { projectRuntimeProductionOperations } from "./skirmish-ai-runtime-production-operation-projection";
import { validateRuntimeProductionProgress } from "./skirmish-ai-runtime-production-progress";
import { runtimeProductionApplicationGaps } from "./skirmish-ai-runtime-production-application-gaps";
import { projectRuntimeProductionEffectRetention } from "./skirmish-ai-runtime-production-effect-retention-projection";
import { projectRuntimeProductionEnqueues } from "./skirmish-ai-runtime-production-event-projection";
import { projectRuntimeProductionLifecycleEvents } from "./skirmish-ai-runtime-production-lifecycle-events";
import { projectRuntimeProductionCatalog } from "./skirmish-ai-runtime-production-catalog-projection";
// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";

/**
 * Pure, bounded by the raw capture limits. Links real dispatch scope to stamped queue authority; no nearest
 * checkpoint, reason string or fixture expectation can supply missing accepted-intent or payment lineage.
 */
export function normalizeRuntimeProductionCausality(
  capture: AiRuntimeProductionCaptureV1,
  setup?: AiRuntimePresetApplicationV1
): RuntimeProductionCausalityV1 {
  const failures: string[] = [];
  const gaps = new Set(capture.gaps);
  gaps.add("production_ai_event_liabilities_missing");
  gaps.add("production_ai_definition_catalog_missing");
  gaps.add("production_ai_paired_setup_missing");
  const authority = normalizeRuntimeProductionWorldAuthority(capture, setup);
  const { world, initial, cadence, spatial, native, construction, constructionLineage, constructionCatalog } =
    authority;
  const { movement, service, resources } = native;
  failures.push(...authority.failures);
  authority.gaps.forEach((gap) => gaps.add(gap));
  failures.push(...runtimeProductionCaptureFailures(capture));
  const operationBoundaries = capture.facts.filter(
    (fact) =>
      fact.kind === "queue_resource" ||
      fact.kind === "queue_changed" ||
      fact.kind === "queue_progress" ||
      fact.kind === "queue_mutation"
  );
  for (const fact of capture.facts) {
    if (fact.kind === "queue_completion") fact.completion.gaps.forEach((gap) => gaps.add(gap));
    if (fact.kind === "queue_mutation") fact.mutation.gaps.forEach((gap) => gaps.add(gap));
    if (fact.kind === "queue_progress") fact.progress.gaps.forEach((gap) => gaps.add(gap));
    fact.boundaryState?.gaps.forEach((gap) => gaps.add(gap));
    if (fact.kind === "outcome" || fact.kind === "intent_dispatch")
      fact.boundaryStateBefore?.gaps.forEach((gap) => gaps.add(gap));
  }
  const scopes = normalizeRuntimeProductionCommands(capture);
  const { commands, admissions } = scopes;
  const dispatches = capture.facts.filter((fact) => fact.kind === "intent_dispatch");
  const outcomes = capture.facts.filter((fact) => fact.kind === "outcome");
  failures.push(...scopes.failures);
  scopes.gaps.forEach((gap) => gaps.add(gap));
  const progress = validateRuntimeProductionProgress(
    capture,
    commands.map((entry) => entry.command)
  );
  failures.push(...progress.failures);
  progress.gaps.forEach((gap) => gaps.add(gap));
  const money = normalizeRuntimeProductionPayments(capture, commands);
  const { queueFacts, payments } = money;
  failures.push(...money.failures);
  money.gaps.forEach((gap) => gaps.add(gap));
  const rejections = projectRuntimeProductionRejections(capture, commands, payments.payments, admissions);
  failures.push(...rejections.failures);
  rejections.gaps.forEach((gap) => gaps.add(gap));
  for (const outcome of outcomes) {
    if (
      outcome.outcome.kind !== "rejected" ||
      !dispatches.some(
        (request) =>
          request.event.kind === "requested" &&
          isRuntimeQueueCommand(request.event.command) &&
          request.event.correlation.intentId === outcome.outcome.intentId &&
          request.event.correlation.effectId === outcome.outcome.effectId &&
          request.event.correlation.commitmentKey === outcome.outcome.commitmentKey
      )
    )
      continue;
    if (
      !commands.some((entry) => entry.command.execution?.commandId === outcome.outcome.commandId) &&
      !admissions.some((entry) => entry.outcome?.sequence === outcome.sequence)
    )
      failures.push("production_ai_unattributed_rejection");
  }
  const operations = projectRuntimeProductionOperations(capture, commands, payments.payments, progress);
  failures.push(...operations.failures);
  operations.gaps.forEach((gap) => gaps.add(gap));
  const mutations = projectRuntimeProductionQueueMutations(capture, commands, payments.payments, operations.operations);
  failures.push(...mutations.failures);
  mutations.gaps.forEach((gap) => gaps.add(gap));
  const enqueues = projectRuntimeProductionEnqueues(capture, mutations.mutations, operations.operations, commands);
  failures.push(...enqueues.failures);
  enqueues.gaps.forEach((gap) => gaps.add(gap));
  const cancellations = projectRuntimeProductionCancellations(
    capture,
    commands,
    mutations.mutations,
    operations.operations
  );
  failures.push(...cancellations.failures);
  cancellations.gaps.forEach((gap) => gaps.add(gap));
  const completions = projectRuntimeProductionCompletions(capture, commands, mutations.mutations);
  failures.push(...completions.failures);
  completions.gaps.forEach((gap) => gaps.add(gap));
  const lifecycle = projectRuntimeProductionLifecycleEvents(capture, {
    enqueues: enqueues.events,
    operations: operations.operations,
    queueMutations: mutations.mutations,
    completions: completions.completions,
    cancellations: cancellations.cancellations
  });
  failures.push(...lifecycle.failures);
  lifecycle.gaps.forEach((gap) => gaps.add(gap));
  const definitions = projectRuntimeProductionCatalog({
    worldSnapshots: world.snapshots,
    queueMutations: mutations.mutations,
    constructionCatalog: constructionCatalog.entries
  });
  failures.push(...definitions.failures);
  definitions.gaps.forEach((gap) => gaps.add(gap));
  const routes = normalizeRuntimeProducerRoutes(capture, commands, completions.completions, spatial.authority);
  failures.push(...routes.failures);
  routes.gaps.forEach((gap) => gaps.add(gap));
  const retention = projectRuntimeProductionEffectRetention(
    capture,
    commands,
    completions.completions,
    world.snapshots
  );
  failures.push(...retention.failures);
  retention.gaps.forEach((gap) => gaps.add(gap));
  for (const fact of queueFacts) {
    if (
      fact.resource.originatingCommandContext?.execution.source !== "ai" ||
      fact.resource.payment !== "per_successful_tick" ||
      fact.resource.operation !== "tick_charge"
    )
      continue;
    if (!operations.operations.some((operation) => operation.operationId === fact.resource.emission.operationId)) {
      gaps.add("production_ai_per_tick_liability_missing");
    }
  }
  runtimeProductionApplicationGaps(capture, commands, payments.payments, mutations.mutations).forEach((gap) =>
    gaps.add(gap)
  );
  // Invalid operations remain in the raw diagnostic; only a sound group is exposed as normalized money.
  return structuredClone({
    schemaVersion: 1,
    failures: [...new Set(failures)],
    gaps: [...gaps].sort(),
    commands,
    operationBoundaries,
    worldSnapshots: failures.length ? [] : world.snapshots,
    initialQueues: failures.length ? [] : initial.items,
    decisions: failures.length ? [] : cadence.decisions,
    spatialAuthority: failures.length ? { placements: [], spawns: [], paths: [] } : spatial.authority,
    producerRoutes: failures.length ? { outputs: [], paths: [] } : routes.routes,
    movements: failures.length ? [] : movement.movements,
    serviceAttempts: failures.length ? [] : service.attempts,
    resourceCredits: failures.length ? [] : resources.credits,
    resourceServices: failures.length
      ? {
          ...native.resourceServices,
          needs: [],
          needAccounting: [],
          applicationIntervals: [],
          coverage: null,
          intervals: []
        }
      : native.resourceServices,
    constructionAuthority: failures.length ? [] : construction.records,
    initialConstruction: failures.length ? null : constructionLineage.initial,
    constructionLineage: failures.length ? [] : constructionLineage.entries,
    constructionCatalog: failures.length ? [] : constructionCatalog.entries,
    payments: failures.length ? [] : payments.payments,
    operations: failures.length ? [] : operations.operations,
    completions: failures.length ? [] : completions.completions,
    effectRetention: failures.length ? [] : retention.effects,
    cancellations: failures.length ? [] : cancellations.cancellations,
    queueMutations: failures.length ? [] : mutations.mutations,
    enqueues: failures.length ? [] : enqueues.events,
    queueLifecycleEvents: failures.length ? [] : lifecycle.events,
    definitionCatalog: failures.length ? [] : definitions.catalog,
    rejections: failures.length ? [] : rejections.rejections
  } satisfies RuntimeProductionCausalityV1);
}
