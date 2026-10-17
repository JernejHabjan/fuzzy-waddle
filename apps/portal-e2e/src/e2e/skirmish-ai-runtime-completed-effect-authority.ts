import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { validateRuntimeQueueCompletionInterval } from "./skirmish-ai-runtime-queue-completion-interval";

/** Actual service/index registration inside the creation call plus its later native terminal; never a useful-effect oracle. */
export function matchRuntimeCompletedEffectAuthority(
  capture: AiRuntimeProductionCaptureV1,
  scope: NonNullable<ReturnType<typeof validateRuntimeQueueCompletionInterval>["scope"]>
) {
  const { before, after, origin } = scope;
  const command = origin.command;
  const terminals = origin.outcomes.filter((fact) => ["completed", "cancelled", "rejected", "failed"].includes(fact.outcome.kind));
  const terminal = terminals[0];
  if (!terminal) return { effect: null, failures: [], gaps: ["production_ai_completion_terminal_missing"] };
  if (terminals.length === 1 && terminal.outcome.kind === "failed" && command.type === "PRODUCTION" &&
    terminal.sequence > after.sequence && terminal.tick >= after.tick && !terminal.outcome.worldLinkIds.length &&
    after.completion.createdActor === null && after.completion.createdActorInProducerScene === null) {
    return { effect: null, failures: [], gaps: ["production_ai_completion_creation_failed"] };
  }
  if (terminals.length !== 1 || terminal.outcome.kind !== "completed" || terminal.outcome.reason !== "applied" ||
    terminal.sequence <= after.sequence || terminal.tick < after.tick || terminal.outcome.worldLinkIds.length !== 1) {
    return { effect: null, failures: ["production_ai_completion_terminal_invalid"], gaps: [] };
  }
  const value = after.completion;
  if (command.type === "PRODUCTION") {
    const actor = value.createdActor;
    if (!actor) return { effect: null, failures: ["production_ai_completion_created_actor_missing"], gaps: [] };
    if (!actor.actorId || !value.requestedCanonicalObjectName ||
      actor.canonicalObjectName !== value.requestedCanonicalObjectName || actor.playerNumber !== command.playerNumber ||
      !actor.active || !actor.alive || !actor.finished || !actor.indexed || value.createdActorInProducerScene !== true ||
      before.completion.researchRegistered !== null || value.researchRegistered !== null ||
      terminal.outcome.worldLinkIds[0] !== actor.actorId) {
      return { effect: null, failures: ["production_ai_completion_actor_authority_invalid"], gaps: [] };
    }
    const registrations = capture.facts.filter((fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "actor_registered" }> =>
      fact.kind === "actor_registered" && fact.actor.actorId === actor.actorId);
    const registered = registrations[0];
    if (!registered) return { effect: null, failures: [], gaps: ["production_ai_completion_actor_registration_missing"] };
    if (registrations.length !== 1 ||
      registered.sequence <= before.sequence || registered.sequence >= after.sequence || registered.tick !== after.tick ||
      registered.snapshotRestoreInProgress || !isDeepStrictEqual(registered.actor, actor) ||
      capture.facts.some((fact) => fact.kind === "actor_unregistered" &&
        fact.actorId === actor.actorId && fact.sequence > registered.sequence && fact.sequence < terminal.sequence)) {
      return { effect: null, failures: ["production_ai_completion_actor_authority_invalid"], gaps: [] };
    }
    return { effect: { registeredSequence: registered.sequence, terminal, createdActor: actor,
      researchType: null, worldLinkId: actor.actorId }, failures: [], gaps: [] };
  }
  if (command.type === "RESEARCH") {
    if (value.createdActor !== null || value.createdActorInProducerScene !== null ||
      value.requestedCanonicalObjectName !== null ||
      terminal.outcome.worldLinkIds[0] !== `research:${command.researchType}`) {
      return { effect: null, failures: ["production_ai_completion_tech_authority_invalid"], gaps: [] };
    }
    const registrations = capture.facts.filter((fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "research_completed" }> =>
      fact.kind === "research_completed" && fact.researchType === command.researchType);
    const registered = registrations[0];
    if (before.completion.researchRegistered !== null && value.researchRegistered !== null &&
      (before.completion.researchRegistered !== false || value.researchRegistered !== true)) {
      return { effect: null, failures: ["production_ai_completion_tech_authority_invalid"], gaps: [] };
    }
    if (!registered || before.completion.researchRegistered === null || value.researchRegistered === null) {
      return { effect: null, failures: [], gaps: ["production_ai_completion_tech_registration_missing"] };
    }
    if (registrations.length !== 1 ||
      registered.sequence <= before.sequence || registered.sequence >= after.sequence || registered.tick !== after.tick ||
      registered.boundaryState?.snapshotRestoreInProgress) {
      return { effect: null, failures: ["production_ai_completion_tech_authority_invalid"], gaps: [] };
    }
    return { effect: { registeredSequence: registered.sequence, terminal, createdActor: null,
      researchType: command.researchType, worldLinkId: `research:${command.researchType}` }, failures: [], gaps: [] };
  }
  return { effect: null, failures: ["production_ai_completion_family_invalid"], gaps: [] };
}
