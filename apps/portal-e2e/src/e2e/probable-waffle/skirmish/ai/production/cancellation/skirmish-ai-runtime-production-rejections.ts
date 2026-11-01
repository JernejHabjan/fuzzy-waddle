import type { GameCommandExecution } from "@fuzzy-waddle/probable-waffle-protocol";
import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionSnapshot } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-snapshot";
import type { AiRuntimeProductionFact } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import type { RuntimeProductionCausality } from "../decisions/skirmish-ai-runtime-production-causality";
import type { RuntimeProductionRejection } from "./skirmish-ai-runtime-production-rejection";
import { matchRuntimeRejectedAdmission } from "../../combat/missions/skirmish-ai-runtime-rejected-admission";
import { validateRuntimeRejectionBoundaries } from "../ownership/skirmish-ai-runtime-rejection-boundaries";
import { reconcileRuntimeProductionUnspent } from "../resources/skirmish-ai-runtime-production-unspent";

/** Selected request / real receipt or stamped rejection, kept separate from accepted commands and physical mutations. */
export function projectRuntimeProductionRejections(
  capture: AiRuntimeProductionSnapshot,
  commands: RuntimeProductionCausality["commands"],
  payments: RuntimeProductionCausality["payments"],
  admissions: readonly NonNullable<ReturnType<typeof matchRuntimeRejectedAdmission>["scope"]>[]
) {
  const failures: string[] = [];
  const gaps: string[] = [];
  const rejections: RuntimeProductionRejection[] = [];
  const append = (
    request: Extract<AiRuntimeProductionFact, { kind: "intent_dispatch" }>,
    receiptSequence: number,
    decision: RuntimeProductionRejection["decision"],
    terminal: Extract<AiRuntimeProductionFact, { kind: "intent_dispatch" | "outcome" }>,
    stage: RuntimeProductionRejection["stage"],
    scheduledTick: number | null,
    nativeOutcome: RuntimeProductionRejection["nativeOutcome"]
  ) => {
    if (request.event.kind !== "requested" || !request.event.acceptedIntent) return;
    const intent = request.event.acceptedIntent;
    const commandId = nativeOutcome?.outcome.commandId ?? null;
    const reason =
      terminal.kind === "outcome"
        ? terminal.outcome.reason
        : terminal.event.kind === "finished" && terminal.event.receipt.status === "rejected"
          ? terminal.event.receipt.reason
          : null;
    if (!reason) return;
    const interval = validateRuntimeRejectionBoundaries(
      terminal.boundaryStateBefore,
      terminal.boundaryState,
      intent,
      commandId,
      stage
    );
    failures.push(...interval.failures);
    gaps.push(...interval.gaps);
    const left = reconcileRuntimeProductionUnspent(
      capture,
      { ...terminal, boundaryState: terminal.boundaryStateBefore },
      commands,
      payments,
      true
    );
    const right = reconcileRuntimeProductionUnspent(capture, terminal, commands, payments);
    failures.push(...left.failures, ...right.failures);
    gaps.push(...left.gaps, ...right.gaps);
    // No resources/physical effect may belong to this rejected attempt. Older retries are fenced by native command ID.
    const next = capture.facts.find(
      (fact) =>
        fact.sequence > request.sequence &&
        fact.kind === "intent_dispatch" &&
        fact.event.kind === "requested" &&
        isDeepStrictEqual(fact.event.correlation, request.event.correlation)
    );
    const sideEffects = capture.facts.filter((fact) => {
      const within = fact.sequence > request.sequence && (!next || fact.sequence < next.sequence);
      if (
        commandId &&
        ((fact.kind === "queue_progress" && fact.progress.item?.commandId === commandId) ||
          (fact.kind === "queue_changed" &&
            fact.queue.lanes.some((lane) => lane.items.some((item) => item.commandId === commandId))))
      ) {
        return true;
      }
      const context =
        fact.kind === "queue_resource"
          ? fact.resource.originatingCommandContext
          : fact.kind === "queue_mutation"
            ? fact.mutation.originatingCommandContext
            : fact.kind === "queue_completion"
              ? fact.completion.originatingCommandContext
              : null;
      const cancel =
        fact.kind === "queue_resource"
          ? fact.resource.cancellationCommand
          : fact.kind === "queue_mutation"
            ? fact.mutation.cancellationCommand
            : null;
      const same = (execution: GameCommandExecution | undefined) =>
        commandId
          ? execution?.commandId === commandId
          : within &&
            execution?.intentId === request.event.correlation.intentId &&
            execution?.effectId === request.event.correlation.effectId;
      if (!same(context?.execution) && !same(cancel?.execution)) return false;
      return true;
    });
    if (sideEffects.length) failures.push("production_ai_rejection_native_effect");
    rejections.push({
      stage,
      requestedSequence: request.sequence,
      requestedTick: request.tick,
      receiptSequence,
      sequence: terminal.sequence,
      tick: terminal.tick,
      commandId,
      scheduledTick,
      reason,
      request: request.event.command,
      acceptedIntent: intent,
      decision,
      nativeOutcome,
      boundarySequences: [terminal.sequence, terminal.sequence],
      resourcesBefore: terminal.boundaryStateBefore?.resources ?? null,
      resourcesAfter: terminal.boundaryState?.resources ?? null,
      obligationsBefore: terminal.boundaryStateBefore?.obligations ?? null,
      obligationsAfter: terminal.boundaryState?.obligations ?? null,
      reservedUnspentBefore: left.resources,
      reservedUnspentAfter: right.resources
    });
  };
  for (const scope of admissions)
    append(scope.request, scope.receipt.sequence, scope.decision, scope.receipt, "admission", null, scope.outcome);
  for (const scope of commands) {
    const rejected = scope.outcomes.filter((fact) => fact.outcome.kind === "rejected");
    if (!rejected.length) continue;
    const terminal = rejected[0];
    if (
      rejected.length !== 1 ||
      !terminal ||
      scope.outcomes.some((fact) =>
        ["applied", "active", "completed", "cancelled", "failed"].includes(fact.outcome.kind)
      ) ||
      terminal.outcome.worldLinkIds.length
    ) {
      failures.push("production_ai_rejection_lifecycle_invalid");
      continue;
    }
    const request = capture.facts.find((fact) => fact.sequence === scope.requestedSequence);
    if (!scope.decision || request?.kind !== "intent_dispatch") {
      gaps.push("production_ai_rejection_decision_missing");
      continue;
    }
    append(request, scope.receiptSequence, scope.decision, terminal, "application", scope.command.tick, terminal);
  }
  return structuredClone({
    rejections: failures.length ? [] : rejections.sort((a, b) => a.sequence - b.sequence),
    failures,
    gaps
  });
}
