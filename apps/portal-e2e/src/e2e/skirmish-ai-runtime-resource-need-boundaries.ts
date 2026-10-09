import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeResourceNeedV1 } from "./skirmish-ai-runtime-resource-need";
import {
  sameRuntimeRouteServiceCommand,
  validateRuntimeRouteServiceRequest
} from "./skirmish-ai-runtime-route-service-command";

/** One exact start may preserve its incoming read, while the same fence always closes older generations. */
export function runtimeNeedHasIncomingStart(
  capture: AiRuntimeProductionCaptureV1,
  need: RuntimeResourceNeedV1
): boolean {
  const read = need.selection.resourceInputRead;
  const selected = capture.facts.find((fact) => fact.sequence === need.selectedSequence);
  const starts = capture.facts.filter(
    (fact) =>
      fact.playerNumber === need.selection.playerNumber &&
      fact.sequence > (read?.sequence ?? Infinity) &&
      fact.sequence < need.selectedSequence &&
      fact.kind === "resource_need_fence" &&
      fact.reason === "controller_decision_started"
  );
  const start = starts[0];
  return (
    !!read &&
    selected?.kind === "decision_selected" &&
    selected.decision.identity.generation === read.generation &&
    selected.decision.identity.playerNumber === read.playerNumber &&
    selected.decision.identity.tick === need.selection.tick &&
    starts.length === 1 &&
    start?.kind === "resource_need_fence" &&
    isDeepStrictEqual(start.incomingRead, read)
  );
}

/** Exempt only one accepted, resource-claim-free gather admission with an exact stamped returned command. */
export function runtimeNeedOwnAdmissionSequences(
  capture: AiRuntimeProductionCaptureV1,
  need: RuntimeResourceNeedV1
): Set<number> {
  const selected = capture.facts.find((fact) => fact.sequence === need.selectedSequence);
  const exempt = new Set<number>();
  if (selected?.kind !== "decision_selected") return exempt;
  const intents = selected.decision.acceptedIntents.filter(
    (intent) => intent.intentId === need.selection.intentId && intent.effectId === need.selection.effectId
  );
  const intent = intents[0];
  if (
    intents.length !== 1 ||
    !intent ||
    intent.kind !== "assign_gatherers" ||
    intent.claims.some((claim) => claim.kind === "resource")
  )
    return exempt;
  const dispatches = capture.facts.filter(
    (fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "intent_dispatch" }> =>
      fact.kind === "intent_dispatch" &&
      fact.playerNumber === need.selection.playerNumber &&
      fact.sequence > need.selectedSequence &&
      fact.event.correlation.intentId === intent.intentId.replace(/^intent:/, "") &&
      fact.event.correlation.effectId === intent.effectId.replace(/^effect:/, "")
  );
  if (dispatches.length !== 2) return exempt;
  const [request, finish] = dispatches;
  if (
    !request ||
    !finish ||
    request.event.kind !== "requested" ||
    finish.event.kind !== "finished" ||
    finish.event.receipt.status !== "dispatched" ||
    request.sequence >= finish.sequence ||
    !isDeepStrictEqual(request.event.acceptedIntent, intent) ||
    !isDeepStrictEqual(request.event.decisionIdentity, selected.decision.identity) ||
    finish.event.playerNumber !== need.selection.playerNumber ||
    !isDeepStrictEqual(request.event.correlation, finish.event.correlation) ||
    validateRuntimeRouteServiceRequest(request).length
  ) {
    return exempt;
  }
  const command = finish.event.receipt.command,
    stamp = command.execution;
  if (
    !stamp ||
    stamp.schemaVersion !== 1 ||
    stamp.source !== "ai" ||
    !stamp.commandId ||
    !Number.isSafeInteger(stamp.sequence) ||
    stamp.sequence < 0 ||
    stamp.authorityEpoch !== selected.decision.identity.authorityEpoch ||
    stamp.intentId !== request.event.correlation.intentId ||
    stamp.effectId !== request.event.correlation.effectId ||
    stamp.commitmentKey !== request.event.correlation.commitmentKey ||
    !sameRuntimeRouteServiceCommand(command, { ...request.event.command, tick: command.tick, execution: stamp })
  )
    return exempt;
  exempt.add(request.sequence);
  exempt.add(finish.sequence);
  const seen = new Set<string>();
  for (const fact of capture.facts) {
    if (fact.kind !== "outcome" || fact.sequence <= request.sequence || fact.playerNumber !== command.playerNumber)
      continue;
    const outcome = fact.outcome;
    if (outcome.commandId !== stamp.commandId) continue;
    const same =
      outcome.schemaVersion === 1 &&
      outcome.playerNumber === command.playerNumber &&
      outcome.authorityEpoch === stamp.authorityEpoch &&
      outcome.sequence === stamp.sequence &&
      outcome.intentId === stamp.intentId &&
      outcome.effectId === stamp.effectId &&
      outcome.commitmentKey === stamp.commitmentKey;
    const admittedActorId = outcome.actorIds[0];
    // The bus publishes dispatch admission; ActionSystem publishes one applied admission per addressed actor.
    const admitted =
      (outcome.kind === "dispatched" &&
        outcome.reason === "accepted_for_dispatch" &&
        isDeepStrictEqual([...outcome.actorIds].sort(), [...command.actorIds].sort()) &&
        outcome.tick === command.tick) ||
      (outcome.kind === "applied" &&
        outcome.reason === "applied" &&
        outcome.actorIds.length === 1 &&
        admittedActorId !== undefined &&
        command.actorIds.includes(admittedActorId));
    const key = `${outcome.kind}:${[...outcome.actorIds].sort().join(",")}`;
    if (!same || !admitted || outcome.worldLinkIds.length || seen.has(key)) continue;
    seen.add(key);
    exempt.add(fact.sequence);
  }
  return exempt;
}
