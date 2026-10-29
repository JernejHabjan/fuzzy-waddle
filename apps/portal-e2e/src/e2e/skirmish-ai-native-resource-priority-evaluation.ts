import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeRecoveryIncome } from "./skirmish-ai-native-recovery-evidence";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";
import { nativeCompletedPlacements } from "./skirmish-ai-native-construction-evidence";
import { nativeWeaponHits } from "./skirmish-ai-native-combat-effects";
import { nativeScoutTrips } from "./skirmish-ai-native-scouting-evaluation";
import { nativeWaitingExposureFailures } from "./skirmish-ai-native-waiting-exposure";
import { hasNativeSourceDeliveryToAnyDropOff } from "./skirmish-ai-source-delivery";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Physical useful work, original ownership and actual scarce balances decide resource/priority outcomes. */
export function evaluateNativeResourcePriority(id: string, branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  if (context.frames.some((frame) => !frame.decision.missionState?.lanes || !frame.decision.missionState.waitEdges ||
    !frame.decision.missionState.authority)) return ["resources_native_lane_dependency_or_authority_boundary_missing"];
  const failures: string[] = [];
  if (id === "H-13") failures.push(...optionalBudgetFailures(branch, context));
  else if (id === "H-14") failures.push(...laneFailures(branch, context));
  else if (id === "H-15") failures.push(...emergencyFailures(branch, context));
  else failures.push("resources_native_case_reader_missing");
  if (context.frames.some((frame) => frame.decision.acceptedIntents.some((intent) => intent.kind === "concede") &&
      frame.decision.missionState?.authority.health !== "healthy")) failures.push("resources_technical_fault_caused_concession");
  return [...new Set(failures)];
}

/** Per-player waiting exposure is separate from legal immediate spending and independently native useful capacity. */
function optionalBudgetFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures = nativeWaitingExposureFailures(context);
  const active = context.frames.map((frame) => frame.decision.missionState?.bases.filter((base) => base.active).length ?? 0);
  if (Math.max(...active) < 4) failures.push("resources_real_multiple_base_budget_premise_missing");
  if (!context.frames.some((frame) => frame.decision.decisions.some((decision) =>
    decision.intent.lane === "optional_infrastructure_tech" && decision.intent.claims.some((claim) => claim.kind === "resource"))))
    failures.push("resources_optional_project_budget_was_never_exercised");
  if (![null, 2].some((sourceOwner) => Object.values(ResourceType).some((resourceType) =>
    hasNativeSourceDeliveryToAnyDropOff(context.capture?.facts ?? [], {
      sourceOwner,
      playerNumber: 2,
      resourceType,
      fromTick: 0,
      throughTick: context.frames.at(-1)?.tick ?? 0
    })
  ))) failures.push("resources_optional_budget_starved_delivered_income");
  const placements = nativeCompletedPlacements(context), outputs = nativePaidMissionOutputs(context);
  if (!placements.length && !outputs.length) failures.push("resources_optional_budget_prevented_all_useful_paid_work");
  if (branch === "new_identity" && !nativePaidNewBaseIdentity(context))
    failures.push("resources_normal_paid_new_base_identity_was_not_exercised");
  if (branch === "essential" && !context.result.perturbations.some((event) => event.id === "loss-essential-house"))
    failures.push("resources_native_essential_loss_control_missing");
  if (branch === "executable" && !placements.some((placement) => {
    const selected = placement.selected, before = selected.decision.input?.resources;
    return selected.decision.acceptedIntents.some((intent) => intent.kind === "construct" &&
      intent.effectId.replace(/^effect:/, "") === placement.value.command.execution?.effectId &&
      intent.lane === "optional_infrastructure_tech" && intent.claims.some((claim) => claim.kind === "resource" &&
        claim.amount > 0 && (before?.find((cash) => cash.resourceType === claim.resourceType)?.stockpile ?? Infinity) < 4 * claim.amount));
  })) failures.push("resources_executable_optional_below_four_times_cost_was_not_natively_completed");
  return failures;
}

/** The new-identity branch closes only after its exact shared command is charged and the site finishes. */
function nativePaidNewBaseIdentity(context: ReturnType<typeof nativeScenarioContext>): boolean {
  const facts = context.capture?.facts ?? [];
  const controls = facts.filter((fact) =>
    fact.kind === "preset_control" && fact.control.id === "ordinary-new-base" && fact.control.phase === "applied"
  );
  const command = controls.length === 1 && controls[0]?.kind === "preset_control" ? controls[0].control.command : null;
  const commandId = command?.execution?.commandId;
  if (!command || command.type !== "CONSTRUCT" || !commandId || command.execution?.source !== "human") return false;
  const placements = facts.filter((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "placement" &&
    fact.spatial.command.execution?.commandId === commandId && fact.spatial.command.actorName === command.actorName &&
    fact.spatial.legal && fact.spatial.site.actorId && fact.spatial.site.playerNumber === 2 && fact.spatial.gaps.length === 0);
  const placement = placements.length === 1 && placements[0]?.kind === "spatial_authority" ? placements[0].spatial : undefined;
  const siteId = placement?.kind === "placement" ? placement.site.actorId : undefined;
  if (!siteId) return false;
  const applied = facts.filter((fact) => fact.kind === "outcome" && fact.outcome.kind === "applied" &&
    fact.outcome.commandId === commandId && fact.outcome.playerNumber === 2 && fact.outcome.worldLinkIds.length === 1 &&
    fact.outcome.worldLinkIds[0] === siteId);
  const charges = facts.filter((fact) => fact.kind === "construction_authority" && fact.construction.kind === "resource" &&
    fact.construction.operation === "start_charge" && fact.construction.site.actorId === siteId &&
    fact.construction.status === "returned" && fact.construction.ownerArgument === 2 &&
    fact.construction.callbackCount === 1 && fact.construction.balanceMatches && !fact.construction.nestedEmission &&
    fact.construction.sceneActive && !fact.construction.snapshotRestoreInProgress);
  const completions = facts.filter((fact) => fact.kind === "construction_authority" && fact.construction.kind === "lifecycle" &&
    fact.construction.transition === "finished" && fact.construction.site.actorId === siteId &&
    fact.construction.clockTick === fact.tick && fact.construction.sceneActive && !fact.construction.snapshotRestoreInProgress);
  return applied.length === 1 && charges.length === 1 && completions.length === 1 &&
    !!context.capture?.frontiers?.intervals.at(-1)?.actors.some(({ identity }) => identity.actorId === siteId &&
      identity.alive && identity.active && identity.indexed && identity.finished);
}

/** Consideration is not service. Only truly compatible dated proposals need bounded native command service. */
function laneFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], frames = context.frames, scout = context.roles["harmless-scout"];
  if (!scout) return ["priorities_native_harmless_scout_role_missing"];
  const sightings = frames.filter((frame) => frame.decision.input?.observation?.actors.some((actor) =>
    actor.actorId === scout && actor.visibility === "visible"));
  if (sightings.length < 2 && !nativeWeaponHits(context, scout).length)
    failures.push("priorities_harmless_native_noise_was_never_seen_or_resolved");
  for (let index = 0; index + 7 < frames.length; index++) {
    const window = frames.slice(index, index + 8), start = window[0];
    if (!start) continue;
    for (const lane of ["scouting", "supply_production", "army_threat"] as const) {
      const eligible = window.filter((frame) => frame.decision.decisions.some((decision) =>
        decision.intent.lane === lane && (decision.outcome === "accepted" ||
          decision.outcome === "rejected" && ["profile_limit", "posture_budget"].includes(decision.reason))));
      if (eligible.length < 4) continue;
      if (!window.slice(0, 4).some((frame) => frame.decision.missionState?.lanes.some((entry) =>
        entry.lane === lane && entry.lastConsideredTick >= start.tick))) failures.push(`priorities_lane_not_considered:${lane}`);
      if (!window.some((frame) => frame.decision.acceptedIntents.some((intent) => intent.lane === lane &&
        context.facts.some((fact) => fact.kind === "outcome" && fact.outcome.kind === "applied" &&
          fact.outcome.effectId === intent.effectId.replace(/^effect:/, "") && fact.sequence > frame.sequence &&
          fact.tick >= frame.tick && fact.tick <= (window.at(-1)?.tick ?? 0)))))
        failures.push(`priorities_compatible_lane_not_natively_serviced:${lane}`);
    }
  }
  if (!nativeRecoveryIncome(context) || branch !== "scarcity" &&
      (!nativeScoutTrips(context).length || !nativePaidMissionOutputs(context).length))
    failures.push("priorities_noise_control_has_no_physical_economy_scouting_or_paid_output");
  if (branch === "scarcity" && !frames.some((frame) => frame.decision.missionState?.blockers.some((blocker) =>
    blocker.cause === "resource"))) failures.push("priorities_genuine_scarcity_has_no_explicit_resource_blocker");
  if (frames.filter((frame) => frame.tick >= 2000).every((frame) =>
    frame.decision.economyProduction.posture?.status === "emergency")) failures.push("priorities_harmless_emergency_never_decayed");
  return failures;
}

/** A real emergency must retain fresh generations and resolve actual delayed ownership while defending physical assets. */
function emergencyFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], frames = context.frames;
  const damage = context.facts.find((fact) => fact.kind === "native_damage" && fact.damage.target.playerNumber === 2 &&
    fact.damage.initiator?.playerNumber === 1 && fact.damage.amount > 0);
  const emergency = frames.filter((frame) => frame.decision.economyProduction.posture?.status === "emergency");
  const defense = Object.entries(context.roles).some(([role, actorId]) =>
    role.startsWith("lethal-attacker-") && nativeWeaponHits(context, actorId, 200).length);
  if (branch !== "far" && (!damage || !emergency.length || !defense))
    failures.push("priorities_native_lethal_attack_and_effective_survival_missing");
  if (branch === "far" && (emergency.length || !frames.some((frame) => frame.decision.input?.observation?.actors.some((actor) =>
    actor.visibility === "visible" && Object.entries(context.roles).some(([role, id]) =>
      role.startsWith("lethal-attacker-") && id === actor.actorId))))) failures.push("priorities_distant_strength_control_false_emergency");
  for (let index = 1; index < frames.length; index++) {
    const before = frames[index - 1], current = frames[index];
    if (before && current && current.tick - before.tick > 40) failures.push("priorities_emergency_stopped_fresh_observation_generations");
  }
  const held = context.facts.find((fact) => fact.kind === "authority_delivery" && fact.delivery.phase === "held");
  const commandId = held?.kind === "authority_delivery" ? held.delivery.outcome?.commandId : undefined;
  const release = commandId ? context.facts.find((fact) => fact.kind === "authority_delivery" &&
    fact.delivery.phase === "released" && fact.delivery.outcome?.commandId === commandId) : undefined;
  const terminalWhileHeld = !!commandId && context.facts.some((fact) => fact.kind === "authority_delivery" &&
    fact.delivery.phase === "held" && fact.delivery.outcome?.commandId === commandId &&
    ["completed", "failed", "rejected", "cancelled"].includes(fact.delivery.outcome.kind));
  const pendingWhileHeld = !!commandId && frames.some((frame) => frame.tick >= (held?.tick ?? Infinity) &&
    frame.tick <= (release?.tick ?? 0) && frame.decision.missionState?.pendingOutcomes.some((outcome) =>
      outcome.identity.commandId === `command:${commandId}`));
  if (branch !== "far" && (!commandId || !release || !terminalWhileHeld || !pendingWhileHeld))
    failures.push("priorities_emergency_did_not_reconcile_original_delayed_receipt");
  if (branch === "resolved" && frames.filter((frame) => frame.tick >= 1800).every((frame) =>
    frame.decision.economyProduction.posture?.status === "emergency")) failures.push("priorities_cleared_real_emergency_never_released");
  return failures;
}
