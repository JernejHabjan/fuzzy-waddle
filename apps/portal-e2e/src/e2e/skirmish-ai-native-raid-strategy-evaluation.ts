import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeWeaponHits, nativeRetainedActor } from "./skirmish-ai-native-combat-effects";
import { nativeLandingFailures, nativeUsefulMissionMembers } from "./skirmish-ai-native-mission-evidence";
import { hasNativeSourceDeliveryToAnyDropOff } from "./skirmish-ai-source-delivery";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Peak simultaneous responders are bounded; rotating defenders may exceed that count across the full window. */
export function nativeMaximumRaidResponseMembers(
  context: ReturnType<typeof nativeScenarioContext>,
  responseTick: number,
  raiderIds: ReadonlySet<string>
) {
  return Math.max(0, ...context.frames.filter((frame) => frame.tick >= responseTick && frame.tick <= responseTick + 800)
    .map((frame) => new Set(frame.decision.missionState?.squads.filter((squad) =>
      squad.role === "defense" || raiderIds.has(squad.objectiveId ?? "")).flatMap((squad) => squad.actorIds) ?? []).size));
}

/** Reinforced defense is judged against the serious wave as well as the original raid party. */
export function nativeRaidThreatIds(branch: string, raiderIds: readonly string[], reinforcementIds: readonly string[]) {
  return ["reinforced", "withdrawn"].includes(branch) ? [...raiderIds, ...reinforcementIds] : [...raiderIds];
}

/** An exact engine-reported objective kill is complete when its native attack was committed before the damage. */
export function nativeObjectiveDestroyedByContact(context: ReturnType<typeof nativeScenarioContext>, targetId: string,
  contactTick: number) {
  return context.facts.some((damage) => damage.kind === "native_damage" && damage.tick < contactTick &&
    damage.damage.target.actorId === targetId && damage.damage.initiator?.playerNumber === 2 &&
    !!damage.damage.initiator.actorId && damage.damage.amount > 0 && damage.damage.healthAfter === 0 &&
    damage.damage.damageTick === damage.tick && damage.damage.sceneActive && damage.damage.targetInCaptureScene &&
    damage.damage.initiatorInCaptureScene && !damage.damage.snapshotRestoreInProgress &&
    context.facts.some((attack) => attack.kind === "native_combat" && attack.operation.kind === "attack_committed" &&
      attack.operation.actor.actorId === damage.damage.initiator?.actorId &&
      attack.operation.target.actorId === targetId && attack.sequence < damage.sequence && attack.tick <= damage.tick));
}

/** A resolved raid releases offense onto the original objective or, if it is gone, the enemy core. */
export function nativeRaidOffenseAfterRecall(context: ReturnType<typeof nativeScenarioContext>, mainTargetId: string,
  enemyHomeId: string, afterTick: number) {
  return [mainTargetId, enemyHomeId].some((targetId) => nativeWeaponHits(context, targetId, afterTick).length > 0);
}

/** Real threat arrival, proportional physical defense and continuing offense must agree across raid controls. */
export function evaluateNativeRaidStrategy(id: string, branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], main = context.role("main-target");
  const ids = Array.from({ length: 4 }, (_, i) => context.role(`raider-${i}`));
  const activeRaid = branch !== "quiet", serious = ["reinforced", "withdrawn"].includes(branch);
  const reinforcements = Object.entries(context.roles).filter(([role]) => role.startsWith("raid-reinforcement-"))
    .map(([, id]) => id);
  const threatIds = nativeRaidThreatIds(branch, ids, reinforcements);
  const contact = context.frames.find((frame) => frame.tick >= 400 && ids.some((id) =>
    frame.decision.input?.observation?.actors.some((actor) => actor.actorId === id && actor.visibility === "visible")));
  const initial = context.frames.find((frame) => frame.tick < 400)?.tacticalBoundary;
  if (Object.keys(context.roles).filter((role) => role.startsWith("army-")).length !== 30)
    failures.push("raid_original_thirty_unit_force_missing");
  if (activeRaid && (!initial || ids.some((id) => initial.actors.find((actor) => actor.identity.actorId === id)?.visible) ||
      !contact || !context.facts.some((fact) => fact.kind === "native_damage" && fact.damage.initiator?.playerNumber === 1 &&
        Object.entries(context.roles).some(([role, id]) => role.startsWith("worker-") && id === fact.damage.target.actorId) &&
        fact.damage.amount > 0))) failures.push("raid_hidden_start_physical_contact_or_native_home_damage_missing");
  if (branch === "boat_raid") failures.push(...nativeLandingFailures(context, "raid"));
  const responseTick = serious ? 800 : contact?.tick ?? 400;
  const responseSquads = context.frames.filter((frame) => frame.tick >= responseTick && frame.tick <= responseTick + 800)
    .flatMap((frame) => frame.decision.missionState?.squads.filter((squad) =>
      squad.role === "defense" || threatIds.includes(squad.objectiveId ?? "")) ?? []);
  const members = new Set(responseSquads.flatMap((squad) => squad.actorIds));
  const effective = [...members].filter((member) => threatIds.some((id) => nativeUsefulMissionMembers(context, id, responseTick).has(member)) ||
    context.arrived(member, responseTick).some((move) => move.observations.some((entry) =>
      entry.spatial.phase === "arrived" && entry.spatial.actualTile && entry.spatial.actualTile.x >= 28)));
  if (activeRaid && !effective.length) failures.push("raid_defense_label_has_no_physical_intervention");
  const maximumResponseMembers = nativeMaximumRaidResponseMembers(context, responseTick, new Set(threatIds));
  const objectiveResolvedBeforeContact = !!contact && (nativeWeaponHits(context, main).some((hit) =>
    hit.kind === "native_damage" && hit.tick < contact.tick && hit.damage.healthAfter === 0) ||
    nativeObjectiveDestroyedByContact(context, main, contact.tick));
  if (!serious && (maximumResponseMembers >= 15 || !nativeWeaponHits(context, main, 400).length && !objectiveResolvedBeforeContact))
    failures.push("raid_minor_threat_recalled_main_force_or_stopped_native_offense");
  if (activeRaid && !nativeRetainedActor(context, context.role("original-home"))) failures.push("raid_original_home_not_retained");
  if (serious) {
    const seen = new Set(context.frames.filter((frame) => frame.tick >= 800).flatMap((frame) =>
      frame.tacticalBoundary?.actors.filter((actor) => reinforcements.includes(actor.identity.actorId ?? "") &&
        actor.visible && actor.identity.alive).map((actor) => actor.identity.actorId) ?? []));
    if (seen.size < 8 || effective.length <= 6) failures.push("raid_serious_threat_not_observed_or_did_not_scale_physical_defense");
    const injury = context.facts.filter((fact) => fact.kind === "native_damage" && fact.tick >= 800 &&
      fact.damage.target.actorId === context.role("original-home") && fact.damage.initiator?.playerNumber === 1);
    if (!injury.length) failures.push("raid_serious_native_asset_danger_missing");
    if (branch === "withdrawn" && !context.frames.some((frame) => frame.tick > 1400 &&
      frame.decision.missionState?.squads.some((squad) => squad.role === "attack" && squad.actorIds.length)) ||
        branch === "withdrawn" && !nativeRaidOffenseAfterRecall(context, main, context.role("enemy-home"), 1400))
      failures.push("raid_resolved_threat_did_not_release_recall_into_useful_offense");
  }
  const serviceContinued = [null, 2].some((sourceOwner) =>
    [ResourceType.Wood, ResourceType.Food, ResourceType.Stone, ResourceType.Minerals].some((resourceType) =>
      hasNativeSourceDeliveryToAnyDropOff(context.capture?.facts ?? [], {
        sourceOwner, playerNumber: 2, resourceType,
        fromTick: contact?.tick ?? 400, throughTick: context.capture?.frontiers?.closedThroughTick ?? 0,
      })));
  if (activeRaid && !serviceContinued) failures.push("raid_home_service_never_continued_after_contact");
  return [...new Set(failures)];
}

/** A strategic loss requires native elimination; a scoped route outage cannot stand in for that mode state. */
export function evaluateNativeComeback(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], defeated = context.result.checkpoints.some((checkpoint) => checkpoint.gameResult === "loss");
  if (branch === "unrecoverable") {
    const closed = context.capture?.frontiers?.intervals.at(-1);
    if (!defeated || !closed || closed.actors.some(({ identity }) => identity.playerNumber === 2 && identity.alive && identity.indexed))
      failures.push("comeback_unrecoverable_control_has_no_native_elimination_and_mode_loss");
    if (!context.result.perturbations.some((event) => event.id === "loss-last-home" &&
        event.affectedActorId === context.role("original-home")))
      failures.push("comeback_last_real_capability_loss_missing");
  } else {
    if (!context.frames.some((frame) => (frame.decision.input?.observation?.actors.filter((actor) =>
        actor.visibility === "visible" && Object.entries(context.roles).some(([role, id]) =>
          role.startsWith("enemy-reserve-") && id === actor.actorId))?.length ?? 0) >= 6))
      failures.push("comeback_stronger_enemy_army_never_legitimately_observed");
    if (defeated) failures.push("comeback_viable_route_incorrectly_became_strategic_defeat");
    const main = context.role("main-target");
    const appliedAttack = context.facts.some((fact) => fact.kind === "command_delivered" &&
      fact.command.type === "ACTOR_ACTION" && fact.command.execution?.source === "ai" &&
      fact.command.orderType === "Attack" && fact.command.targetObjectIds?.includes(main) &&
      context.facts.some((outcome) => outcome.kind === "outcome" && outcome.outcome.kind === "applied" &&
        outcome.outcome.commandId === fact.command.execution?.commandId));
    if (!appliedAttack) failures.push("comeback_risky_objective_has_no_shared_ai_attack_application");
    if (!nativeWeaponHits(context, context.role("main-target"), branch === "path_outage" ? 800 : 0).length)
      failures.push("comeback_feasible_risky_objective_has_no_native_effect");
    if (branch === "path_outage" && !context.result.perturbations.some((event) => event.id === "comeback-route-outage" &&
        event.tick >= 400 && event.tick <= 800 && event.affectedActorId)) failures.push("comeback_route_outage_never_exercised");
  }
  return failures;
}

/** Terminal victory must be the ordinary score transition after AI-owned native damage to the original enemy core. */
export function evaluateNativeFinish(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const win = context.result.checkpoints.find((checkpoint) => checkpoint.gameResult === "win");
  const core = context.role("enemy-home");
  const damage = nativeWeaponHits(context, core);
  if (branch === "defended" && (!context.frames.some((frame) => frame.tick < 800 &&
      frame.decision.input?.observation?.actors.some((actor) => actor.visibility === "visible" &&
        Object.entries(context.roles).some(([role, id]) => role.startsWith("core-guard-") && id === actor.actorId))) ||
      !context.opponent?.facts.some((fact) => fact.kind === "preset_control" && fact.tick === 800 &&
        fact.control.id.startsWith("core-guard-withdraw-") && fact.control.phase === "applied") ||
      !damage.some((fact) => fact.tick >= 800))) return ["finish_defended_core_opening_not_natively_exercised"];
  return win && damage.length && context.opponent?.frontiers?.intervals.at(-1)?.actors.every(({ identity }) =>
    identity.actorId !== core || !identity.alive) && !context.facts.some((fact) =>
      fact.kind === "command_delivered" && fact.command.type === "CONCEDE") ? [] :
    ["finish_native_core_defeat_and_authoritative_win_missing"];
}
