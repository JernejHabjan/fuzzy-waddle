import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeWeaponHits, nativeRetainedActor, nativeRetreats } from "./skirmish-ai-native-combat-effects";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";
import { nativeScoutTrips } from "./skirmish-ai-native-scouting-evaluation";

/** Uncertain forces, repeated retreats and reinforcements must produce useful effects within fixed native bounds. */
export function evaluateNativeMissionRecovery(id: string, branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  if (id === "H-24") return uncertaintyFailures(branch, context);
  if (id === "H-25") return oscillationFailures(branch, context);
  if (id === "H-26") return reinforcementFailures(branch, context);
  return ["recovery_mission_reader_missing"];
}

/** Hidden force is oracle-only; limited useful action must not borrow its current strength from privileged capture. */
function uncertaintyFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], hidden = Object.entries(context.roles).filter(([role]) => role.startsWith("hidden-force-"))
    .map(([, id]) => id), target = context.roles["mission-target"];
  const initial = context.frames.find((frame) => frame.tick <= 100);
  if (hidden.length !== 16 || !initial || initial.decision.input?.observation?.actors.some((actor) => hidden.includes(actor.actorId)))
    failures.push("recovery_real_hidden_force_uncertainty_missing");
  if (branch === "unsafe") {
    const seen = context.frames.find((frame) => frame.decision.input?.observation?.actors.filter((actor) =>
      actor.visibility === "visible" && Object.entries(context.roles).some(([role, id]) =>
        role.startsWith("known-danger-") && id === actor.actorId)).length >= 4);
    const lost = context.facts.filter((fact) => fact.kind === "actor_unregistered" &&
      Object.entries(context.roles).some(([role, id]) => role.startsWith("army-") && id === fact.actorId));
    if (!seen || lost.length > 2 || !context.frames.some((frame) => frame.tick > (seen?.tick ?? Infinity) &&
        frame.decision.missionState?.squads.some((squad) => ["retreat", "regroup", "reserve", "defend"].includes(squad.state))))
      failures.push("recovery_losing_control_did_not_preserve_force");
  } else if (branch === "information") {
    const trips = nativeScoutTrips(context), discovery = context.frames.find((frame) =>
      frame.decision.input?.observation?.actors.some((actor) => actor.actorId === target && actor.visibility === "visible"));
    if (!trips.some((trip) => trip.selectedTick <= 1200) || !discovery || discovery.tick > 2400)
      failures.push("recovery_uncertain_force_has_no_bounded_native_information_gain");
  } else if (!nativeWeaponHits(context, target).some((fact) => fact.tick <= 2400))
    failures.push("recovery_uncertain_force_did_not_reach_and_contest_opportunity");
  return failures;
}

/** Repeated real pressure must be exercised; avoiding the loop with an early useful alternate is also valid recovery. */
function oscillationFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], frames = context.frames.filter((frame) => frame.tick <= 2400);
  const subject = frames.flatMap((frame) => frame.decision.missionState?.squads.filter((squad) =>
    squad.role === "attack" && squad.actorIds.some((id) => id === context.roles["army-0"])) ?? []);
  const transitions = subject.filter((squad, index) => index === 0 || squad.state !== subject[index - 1]?.state);
  const looped = transitions.filter((squad) => ["retreat", "retreating", "regroup"].includes(squad.state)).length >= 2 &&
    transitions.filter((squad) => ["advance", "moving", "engage", "engaged"].includes(squad.state)).length >= 2;
  const alternate = context.roles["alternative-target"];
  const earlyAlternate = !!alternate && nativeWeaponHits(context, alternate).some((fact) => fact.tick <= 1200);
  if (!earlyAlternate && (!looped ||
      transitions.filter((squad) => ["advance", "moving", "engage", "engaged"].includes(squad.state)).length < 2 ||
      nativeRetreats(context, 400).length < 2)) failures.push("recovery_no_early_alternate_or_exercised_choke_oscillation");
  if (!context.facts.some((fact) => fact.kind === "native_damage" && fact.damage.initiator?.playerNumber === 1 &&
      Object.entries(context.roles).some(([role, id]) => role.startsWith("army-") && id === fact.damage.target.actorId)))
    failures.push("recovery_real_choke_pressure_missing");
  const original = subject[0];
  if (branch === "no_alternative") {
    const closed = context.frames.find((frame) => frame.tick >= 1200 && frame.tick <= 3000 &&
      frame.decision.missionState?.squads.some((squad) => squad.squadId === original?.squadId &&
        ["cancelled", "completed", "reserve", "defend"].includes(squad.state)));
    if (!original || !closed || !original.actorIds.some((actor) => nativeRetainedActor(context, actor)))
      failures.push("recovery_infeasible_optional_attack_never_safely_closed");
  } else {
    const objective = branch === "alternative" ? context.roles["alternative-target"] : context.roles["mission-target"];
    if (!objective || !nativeWeaponHits(context, objective, earlyAlternate ? 0 : 1200).length)
      failures.push("recovery_oscillation_has_no_native_changed_mission_effect");
    if (branch === "changed_force" && !nativePaidMissionOutputs(context).some((output) =>
      nativeWeaponHits(context, objective, 1200).some((fact) => fact.kind === "native_damage" &&
        fact.damage.initiator?.actorId === output.actor.actorId))) failures.push("recovery_changed_force_not_actually_used");
  }
  return failures;
}

/** Identify actual paid outputs; complete group/alternate arrivals or safe restraint must accompany continuing front effects. */
function reinforcementFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], output = nativePaidMissionOutputs(context).filter((entry) =>
    entry.fact.kind === "queue_completion" && entry.fact.completion.actorId === context.roles["ready-producer"]);
  const original = context.result.presetInitialQueueItems;
  const reinforcements = output.filter((entry) => original.some((item) => item.itemId === entry.item.itemId));
  if (original.length !== 4 || reinforcements.length !== 4) failures.push("recovery_original_four_paid_reinforcements_missing");
  const ids = reinforcements.flatMap((entry) => entry.actor.actorId ? [entry.actor.actorId] : []);
  const seen = context.frames.find((frame) => frame.decision.input?.observation?.actors.some((actor) =>
    actor.visibility === "visible" && Object.entries(context.roles).some(([role, id]) =>
      role.startsWith("choke-guard-") && id === actor.actorId)));
  if (!seen) failures.push("recovery_lethal_reinforcement_route_never_fairly_known");
  const nativeDeaths = context.facts.filter((fact) => fact.kind === "native_damage" && fact.damage.initiator?.playerNumber === 1 &&
    fact.damage.target.actorId && ids.includes(fact.damage.target.actorId) && !fact.damage.target.alive);
  if (nativeDeaths.length > 1) failures.push("recovery_repeated_native_one_unit_reinforcement_losses");
  const direct = (frame: typeof context.frames[number]) => frame.tacticalBoundary?.actors.filter((actor) =>
    actor.identity.actorId && ids.includes(actor.identity.actorId) && actor.identity.alive && actor.tile &&
    actor.tile.x >= 24 && actor.tile.x <= 25 && actor.tile.y >= 23 && actor.tile.y <= 26) ?? [];
  if (branch === "grouping" && !context.frames.some((frame) => direct(frame).length >= 3))
    failures.push("recovery_reinforcements_never_physically_grouped_at_choke");
  if (branch === "safe_alternate" && !ids.some((id) => context.arrived(id).some((movement) =>
    movement.observations.some((entry) => entry.spatial.actualTile &&
      entry.spatial.actualTile.x >= 24 && entry.spatial.actualTile.x <= 25 && entry.spatial.actualTile.y >= 37))))
    failures.push("recovery_reinforcements_never_used_native_safe_alternate");
  if (branch === "no_safe_route" && (!ids.some((id) => nativeRetainedActor(context, id)) ||
      context.frames.some((frame) => frame.tick >= 1600 && direct(frame).length === 1)))
    failures.push("recovery_no_safe_route_kept_feeding_or_lost_all_outputs");
  if (branch === "threat_clears" && (context.result.perturbations.filter((event) =>
      event.id.startsWith("loss-choke-guard-") && event.tick === 1200).length !== 4 ||
      !ids.some((id) => context.arrived(id, 1200).length))) failures.push("recovery_cleared_route_not_natively_reused");
  if (!nativeWeaponHits(context, context.roles["mission-target"]).some((fact) => fact.kind === "native_damage" &&
      Object.entries(context.roles).some(([role, id]) => role.startsWith("army-") && id === fact.damage.initiator?.actorId)))
    failures.push("recovery_original_main_front_lost_useful_effect");
  return failures;
}
