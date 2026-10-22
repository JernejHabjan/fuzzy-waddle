import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeCompletedPlacements } from "./skirmish-ai-native-construction-evidence";
import { nativeRecoveryCommonFailures } from "./skirmish-ai-native-recovery-evidence";
import { hasNativeSourceDelivery } from "./skirmish-ai-source-delivery";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Original manifest/readiness, actual native cargo and an earned island deposit/income are separate required effects. */
export function evaluateNativeIslandEstablishment(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures = nativeRecoveryCommonFailures(context);
  const history = context.frames.flatMap((frame) => (frame.decision.missionState?.transport ?? [])
    .filter((plan) => plan.lifecycle?.missionKind === "island_establishment").map((plan) => ({ frame, plan })));
  const original = history[0], initial = original?.plan.lifecycle;
  if (!original || !initial || initial.requiredCapacity !== 4 || initial.departureCapacityPermille !== 750 ||
    !initial.manifest.some((member) => member.role === "builder" && member.indispensable) ||
    !initial.manifest.some((member) => member.role === "protection" && member.indispensable))
    return [...failures, "island_actual_protected_builder_manifest_premise_missing"];
  const rows = history.filter(({ plan }) => plan.planId === original.plan.planId);
  if (rows.some(({ plan }) => plan.lifecycle?.requiredCapacity !== initial.requiredCapacity ||
    plan.lifecycle.departureCapacityPermille !== initial.departureCapacityPermille))
    failures.push("island_original_minimum_departure_readiness_was_lowered");
  const delay = context.result.perturbations.find((event) => event.id === "island-original-passenger-delay");
  const delayed = initial.manifest.find((member) => member.actorId === delay?.affectedActorId);
  if (!delay?.affectedActorId || !delayed || (branch === "builder_late" ?
    !delayed.indispensable || delayed.role !== "builder" : delayed.indispensable))
    failures.push("island_actual_original_passenger_route_delay_missing");
  const departure = rows.find(({ plan }) => ["transit", "landing", "unloading"].includes(plan.phase));
  for (const { frame, plan } of rows.filter(({ plan }) => plan.phase === "transit")) {
    const onboard = new Set(frame.tacticalBoundary?.actors.filter((actor) =>
      plan.lifecycle?.assignedTransportIds.includes(actor.identity.actorId ?? ""))
      .flatMap((actor) => actor.passengerIds ?? []));
    if (!initial.manifest.filter((member) => member.indispensable).every((member) => onboard.has(member.actorId)) ||
      initial.manifest.filter((member) => onboard.has(member.actorId)).reduce((sum, member) => sum + member.seats, 0) * 1000 <
        initial.requiredCapacity * initial.departureCapacityPermille)
      failures.push("island_departure_lacked_actual_required_cargo_or_original_readiness");
  }
  if (branch === "builder_late") {
    if (departure && departure.frame.tick <= 1001) failures.push("island_sailed_without_delayed_indispensable_builder");
    if (!rows.some(({ frame, plan }) => frame.tick <= 3000 &&
      ["completed", "cancelled", "failed"].includes(plan.phase))) failures.push("island_required_builder_failure_never_resolved");
  } else {
    if (!departure || departure.frame.tick > initial.phaseDeadline.dueTick)
      failures.push("island_optional_straggler_blocked_original_departure_deadline");
    if (branch === "optional_late" && departure?.plan.passengerIds.includes(delay?.affectedActorId ?? ""))
      failures.push("island_late_optional_passenger_was_not_released");
    const builder = initial.manifest.find((member) => member.role === "builder" && member.indispensable)?.actorId;
    const landings = context.frames.filter((frame) => frame.tick > (departure?.frame.tick ?? Infinity) &&
      frame.tacticalBoundary?.actors.some((actor) => actor.identity.actorId === builder && actor.identity.alive &&
        actor.containerId === null && actor.tile && actor.tile.x >= 17 && actor.tile.x <= 22 &&
        actor.tile.y >= 22 && actor.tile.y <= 33));
    const deposit = nativeCompletedPlacements(context).find((placement) => placement.fact.tick >= (landings[0]?.tick ?? Infinity) &&
      placement.value.site.canonicalObjectName === "WorkMill" &&
      placement.value.command.tileVec3.x >= 17 && placement.value.command.tileVec3.x <= 22 &&
      placement.value.command.tileVec3.y >= 22 && placement.value.command.tileVec3.y <= 33);
    if (!landings.length || !deposit || !hasNativeSourceDelivery(context.capture?.facts ?? [], {
      sourceActorId: context.role("island-source"), sourceOwner: null, playerNumber: 2, resourceType: ResourceType.Wood,
      depositActorId: deposit?.siteId, fromTick: deposit?.completionTick ?? 3000, throughTick: 3000 }))
      failures.push("island_actual_unload_paid_foothold_and_delivered_income_missing");
  }
  if (branch === "optional_lost" && !context.result.perturbations.some((event) =>
    event.id === "island-original-optional-loss" && initial.manifest.some((member) =>
      !member.indispensable && member.actorId === event.affectedActorId))) failures.push("island_actual_optional_loss_missing");
  return [...new Set(failures)];
}
