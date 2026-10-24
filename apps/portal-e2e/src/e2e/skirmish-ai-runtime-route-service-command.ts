import { isDeepStrictEqual } from "node:util";
import { OrderType, ResourceType, type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeRouteOrderV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-route-order-v1";

/** Complete shared movement/service payload and all eight stamp fields; no target-only command matching. */
export function sameRuntimeRouteServiceCommand(left: GameCommand, right: GameCommand | undefined): boolean {
  if (!right || left.type !== right.type || left.tick !== right.tick || left.playerNumber !== right.playerNumber ||
    !isDeepStrictEqual(left.actorIds, right.actorIds) ||
    !(["schemaVersion", "commandId", "commitmentKey", "source", "authorityEpoch", "sequence", "intentId", "effectId"] as const)
      .every((key) => left.execution?.[key] === right.execution?.[key])) return false;
  return left.type === "ACTOR_ACTION" && right.type === "ACTOR_ACTION" ?
    left.orderType === right.orderType && left.queue === right.queue &&
      isDeepStrictEqual(left.targetObjectIds, right.targetObjectIds) && isDeepStrictEqual(left.tileVec3, right.tileVec3) :
    left.type === "MOVE" && right.type === "MOVE" && left.queue === right.queue &&
      isDeepStrictEqual(left.tileVec3, right.tileVec3) && isDeepStrictEqual(left.worldVec3, right.worldVec3);
}

/** Mirrors the existing intent dispatcher, without translating a new command or resolving a live target. */
export function validateRuntimeRouteServiceRequest(request: Extract<AiRuntimeProductionFactV1, { kind: "intent_dispatch" }>) {
  if (request.event.kind !== "requested") return ["production_route_service_request_invalid"];
  const event = request.event, intent = event.acceptedIntent, command = event.command;
  if (!intent || command.type !== "ACTOR_ACTION" || !("actorIds" in intent)) {
    return ["production_route_service_request_invalid"];
  }
  const target = command.targetObjectIds;
  const oneTarget = (actorId: string | null) => !!actorId && isDeepStrictEqual(target, [actorId]) && !command.tileVec3;
  const payload = intent.kind === "move" || intent.kind === "scout" ? command.orderType === OrderType.Move && !target &&
    isDeepStrictEqual(command.tileVec3, intent.logicalPosition) :
    intent.kind === "assign_gatherers" ? command.orderType === OrderType.Gather && oneTarget(intent.sourceActorId) :
    intent.kind === "resume_construct" ? command.orderType === OrderType.Build && oneTarget(intent.targetActorId) :
    intent.kind === "board" ? command.orderType === OrderType.EnterContainer && oneTarget(intent.transportId) :
    intent.kind === "attack" ? command.orderType === OrderType.Attack &&
      isDeepStrictEqual(target, intent.targetActorId ? [intent.targetActorId] : undefined) &&
      isDeepStrictEqual(command.tileVec3, intent.targetPosition ?? undefined) :
    ["heal", "repair", "tend"].includes(intent.kind) && "targetActorId" in intent &&
      command.orderType === (intent.kind === "heal" ? OrderType.Heal : intent.kind === "repair" ? OrderType.Repair : OrderType.Gather) &&
      oneTarget(intent.targetActorId);
  if (!payload || command.queue !== false || !isDeepStrictEqual(command.actorIds, intent.actorIds) ||
    !command.actorIds.length || command.actorIds.length > 256 || command.actorIds.some((id) => !id) ||
    new Set(command.actorIds).size !== command.actorIds.length ||
    (command.tileVec3 && Object.values(command.tileVec3).some((value) => !Number.isFinite(value))) ||
    command.playerNumber !== request.playerNumber || event.playerNumber !== request.playerNumber ||
    !intent.planId || intent.demandId !== null && !intent.demandId ||
    event.correlation.intentId !== intent.intentId.replace(/^intent:/, "") ||
    event.correlation.effectId !== intent.effectId.replace(/^effect:/, "") ||
    !event.correlation.intentId || !event.correlation.effectId || event.correlation.commitmentKey !== `ai:${intent.effectId}` ||
    !isDeepStrictEqual(event.claims, intent.claims) ||
    event.claims.length > 256 ||
    new Set(event.claims.map((claim) => claim.claimId)).size !== event.claims.length ||
    event.claims.some((claim) => !claim.claimId || claim.kind === "resource" &&
      (!Object.values(ResourceType).includes(claim.resourceType) || !Number.isFinite(claim.amount) || claim.amount < 0)) ||
    !Number.isSafeInteger(event.proposedTick) || event.proposedTick < 0 ||
    event.proposedTick !== intent.proposedTick || event.proposedTick > request.tick) {
    return ["production_route_service_request_invalid"];
  }
  return [];
}

/** Context equality also applies to orders whose payload remains owned by the construction diagnostic. */
export function runtimeRouteOrderHasCommandContext(order: AiRuntimeRouteOrderV1, actorId: string, command: GameCommand): boolean {
  const context = order.commandContext;
  if (!context || context.playerNumber !== command.playerNumber || !command.actorIds.includes(actorId) ||
    !isDeepStrictEqual(context.actorIds, command.actorIds) ||
    !(["schemaVersion", "commandId", "commitmentKey", "source", "authorityEpoch", "sequence", "intentId", "effectId"] as const)
      .every((key) => context.execution[key] === command.execution?.[key])) return false;
  return true;
}

/** Native admission payload, before mutable gather/attack orders can retarget. No later sample repairs a missing admission. */
export function runtimeRouteOrderMatchesCommand(order: AiRuntimeRouteOrderV1, actorId: string, command: GameCommand): boolean {
  if (!runtimeRouteOrderHasCommandContext(order, actorId, command)) return false;
  if (command.type === "MOVE") return order.orderType === OrderType.Move && !order.target &&
    isDeepStrictEqual(order.targetTile, command.tileVec3);
  return command.type === "ACTOR_ACTION" && (command.orderType === undefined || command.orderType === order.orderType) &&
    (order.target?.actorId ?? undefined) === command.targetObjectIds?.[0] &&
    isDeepStrictEqual(order.targetTile ?? undefined, command.tileVec3);
}
