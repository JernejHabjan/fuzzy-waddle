import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionCompletionV1 } from "./skirmish-ai-runtime-production-completion";
import { validateRuntimeQueueCompletionInterval } from "./skirmish-ai-runtime-queue-completion-interval";
import { matchRuntimeCompletedEffectAuthority } from "./skirmish-ai-runtime-completed-effect-authority";

/** Joins native purchase -> consumed-head removal -> actual creator/tech registration -> terminal, retaining every gap. */
export function projectRuntimeProductionCompletions(
  capture: AiRuntimeProductionCaptureV1, commands: RuntimeProductionCausalityV1["commands"],
  mutations: RuntimeProductionCausalityV1["queueMutations"]
) {
  const completions: RuntimeProductionCompletionV1[] = [];
  const failures: string[] = [];
  const gaps: string[] = [];
  const facts = capture.facts.filter((fact) => fact.kind === "queue_completion");
  const ids = new Set(facts.map((fact) => fact.completion.completionId));
  const usedEffects = new Set<string>();
  const usedRemovals = new Set<number>();
  for (const id of ids) {
    const group = facts.filter((fact) => fact.completion.completionId === id);
    if (!group.some((fact) => fact.completion.originatingCommandContext?.execution.source === "ai")) continue;
    const interval = validateRuntimeQueueCompletionInterval(group, commands);
    failures.push(...interval.failures); gaps.push(...interval.gaps);
    const scope = interval.scope;
    if (!scope) continue;
    const { before, after, origin } = scope;
    const execution = origin.command.execution;
    if (!execution?.effectId || !before.completion.item) { gaps.push("production_ai_completion_native_scope_missing"); continue; }
    const authority = matchRuntimeCompletedEffectAuthority(capture, scope);
    failures.push(...authority.failures); gaps.push(...authority.gaps);
    const effect = authority.effect;
    if (!effect) continue;
    const removals = mutations.filter((mutation) => mutation.operation === "complete_remove" &&
      mutation.originatingCommandId === execution.commandId && mutation.actorId === before.completion.actorId);
    const removal = removals[0];
    if (!removal) { gaps.push("production_ai_completion_removal_authority_missing"); continue; }
    if (removals.length !== 1 || usedRemovals.has(removal.mutationId) || removal.sequence >= before.sequence ||
      removal.tick > before.tick || !isDeepStrictEqual(removal.item, before.completion.item) ||
      capture.facts.some((fact) => fact.kind === "queue_mutation" && fact.sequence > removal.sequence &&
        fact.sequence < after.sequence && fact.mutation.item?.itemId === removal.item.itemId)) {
      failures.push("production_ai_completion_removal_lineage_invalid"); continue;
    }
    // Native retries can share an effect correlation, but cannot consume the same actual product/tech twice.
    const effectKey = effect.createdActor ? `actor:${effect.worldLinkId}` : `tech:${effect.researchType}`;
    if (usedEffects.has(effectKey)) { failures.push("production_ai_completion_effect_reused"); continue; }
    usedEffects.add(effectKey); usedRemovals.add(removal.mutationId);
    completions.push({ completionId: id, originatingCommandId: execution.commandId, effectId: execution.effectId,
      planId: origin.acceptedIntent.planId, actorId: removal.actorId, itemId: removal.item.itemId,
      requestedSequence: origin.requestedSequence, requestedTick: origin.requestedTick, scheduledTick: origin.command.tick,
      removalSequence: removal.sequence, removalTick: removal.tick,
      authorityBoundarySequences: [before.sequence, after.sequence], authorityTick: after.tick,
      registeredSequence: effect.registeredSequence, terminalSequence: effect.terminal.sequence, terminalTick: effect.terminal.tick,
      createdActor: effect.createdActor, researchType: effect.researchType, worldLinkId: effect.worldLinkId });
  }
  if (mutations.some((mutation) => mutation.operation === "complete_remove" && !usedRemovals.has(mutation.mutationId))) {
    gaps.push("production_ai_mutation_created_effect_authority_missing");
  }
  for (const scope of commands) {
    if (["PRODUCTION", "RESEARCH"].includes(scope.command.type) && scope.outcomes.some((fact) => fact.outcome.kind === "completed") &&
      !completions.some((completion) => completion.originatingCommandId === scope.command.execution?.commandId)) {
      gaps.push("production_ai_completed_effect_authority_missing");
    }
  }
  return structuredClone({ completions: failures.length ? [] : completions, failures: [...new Set(failures)], gaps: [...new Set(gaps)] });
}
