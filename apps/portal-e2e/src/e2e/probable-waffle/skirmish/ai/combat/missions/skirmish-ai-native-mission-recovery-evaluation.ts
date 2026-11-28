import type { nativeScenarioContext } from "../../contracts/skirmish-ai-native-scenario-context";
import { nativeRetainedActor, nativeRetreats, nativeWeaponHits } from "../effects/skirmish-ai-native-combat-effects";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";
import { nativeScoutTrips } from "../../evaluation/controls/skirmish-ai-native-scouting-evaluation";

type NativeMissionRecoveryFrame = ReturnType<typeof nativeScenarioContext>["frames"][number];

/** Uncertain forces, repeated retreats and reinforcements must produce useful effects within fixed native bounds. */
export function evaluateNativeMissionRecovery(
  id: string,
  branch: string,
  context: ReturnType<typeof nativeScenarioContext>
) {
  if (id === "H-24") return uncertaintyFailures(branch, context);
  if (id === "H-25") return oscillationFailures(branch, context);
  if (id === "H-26") return reinforcementFailures(branch, context);
  return ["recovery_mission_reader_missing"];
}

/** Hidden force is oracle-only; limited useful action must not borrow its current strength from privileged capture. */
function uncertaintyFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [],
    hidden = Object.entries(context.roles)
      .filter(([role]) => role.startsWith("hidden-force-"))
      .map(([, id]) => id),
    target = context.roles["mission-target"];
  const initial = context.frames.find((frame) => frame.tick <= 100);
  if (
    hidden.length !== 16 ||
    !initial ||
    initial.decision.input?.observation?.actors.some((actor) => hidden.includes(actor.actorId))
  )
    failures.push("recovery_real_hidden_force_uncertainty_missing");
  if (branch === "unsafe") {
    const seen = context.frames.find(
      (frame) =>
        (frame.decision.input?.observation?.actors.filter(
          (actor) =>
            actor.visibility === "visible" &&
            Object.entries(context.roles).some(([role, id]) => role.startsWith("known-danger-") && id === actor.actorId)
        )?.length ?? 0) >= 4
    );
    const lost = context.facts.filter(
      (fact) =>
        fact.kind === "actor_unregistered" &&
        Object.entries(context.roles).some(([role, id]) => role.startsWith("army-") && id === fact.actorId)
    );
    const retainedArmy = Object.entries(context.roles)
      .filter(([role]) => /^army-[0-2]$/.test(role))
      .filter(([, actorId]) => nativeRetainedActor(context, actorId)).length;
    if (!seen || lost.length > 2 || retainedArmy < 2) failures.push("recovery_losing_control_did_not_preserve_force");
  } else if (branch === "information") {
    const trips = nativeScoutTrips(context),
      discovery = context.frames.find((frame) =>
        frame.decision.input?.observation?.actors.some(
          (actor) => actor.actorId === target && actor.visibility === "visible"
        )
      );
    if (!trips.some((trip) => trip.selectedTick <= 400) || !discovery || discovery.tick > 400)
      failures.push("recovery_uncertain_force_has_no_bounded_native_information_gain");
  } else if (!nativeWeaponHits(context, target).some((fact) => fact.tick <= 400))
    failures.push("recovery_uncertain_force_did_not_reach_and_contest_opportunity");
  return failures;
}

/** Repeated real pressure must be exercised; avoiding the loop with an early useful alternate is also valid recovery. */
function oscillationFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [],
    frames = context.frames.filter((frame) => frame.tick <= 2400);
  const subject = frames.flatMap(
    (frame) =>
      frame.decision.missionState?.squads.filter(
        (squad) => squad.role === "attack" && squad.actorIds.some((id) => id === context.roles["army-0"])
      ) ?? []
  );
  const transitions = subject.filter((squad, index) => index === 0 || squad.state !== subject[index - 1]?.state);
  const looped =
    transitions.filter((squad) => ["retreat", "retreating", "regroup"].includes(squad.state)).length >= 2 &&
    transitions.filter((squad) => ["advance", "moving", "engage", "engaged"].includes(squad.state)).length >= 2;
  const alternate = context.roles["alternative-target"];
  const earlyAlternate = !!alternate && nativeWeaponHits(context, alternate).some((fact) => fact.tick <= 1200);
  if (
    !earlyAlternate &&
    (!looped ||
      transitions.filter((squad) => ["advance", "moving", "engage", "engaged"].includes(squad.state)).length < 2 ||
      nativeRetreats(context, 400).length < 2)
  )
    failures.push("recovery_no_early_alternate_or_exercised_choke_oscillation");
  if (
    !context.facts.some(
      (fact) =>
        fact.kind === "native_damage" &&
        fact.damage.initiator?.playerNumber === 1 &&
        Object.entries(context.roles).some(
          ([role, id]) => role.startsWith("army-") && id === fact.damage.target.actorId
        )
    )
  )
    failures.push("recovery_real_choke_pressure_missing");
  const original = subject[0];
  if (branch === "no_alternative") {
    const closed = context.frames.find(
      (frame) =>
        frame.tick >= 1200 &&
        frame.tick <= 3000 &&
        frame.decision.missionState?.squads.some(
          (squad) =>
            squad.squadId === original?.squadId && ["cancelled", "completed", "reserve", "defend"].includes(squad.state)
        )
    );
    if (!original || !closed || !original.actorIds.some((actor) => nativeRetainedActor(context, actor)))
      failures.push("recovery_infeasible_optional_attack_never_safely_closed");
  } else {
    const objective = branch === "alternative" ? context.roles["alternative-target"] : context.roles["mission-target"];
    if (!objective || !nativeWeaponHits(context, objective, earlyAlternate ? 0 : 1200).length)
      failures.push("recovery_oscillation_has_no_native_changed_mission_effect");
    if (
      branch === "changed_force" &&
      !nativePaidMissionOutputs(context).some((output) =>
        nativeWeaponHits(context, objective, 1200).some(
          (fact) => fact.kind === "native_damage" && fact.damage.initiator?.actorId === output.actor.actorId
        )
      )
    )
      failures.push("recovery_changed_force_not_actually_used");
  }
  return failures;
}

/** Identify actual paid outputs; complete group/alternate arrivals or safe restraint must accompany continuing front effects. */
function reinforcementFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [],
    output = nativePaidMissionOutputs(context).filter(
      (entry) =>
        entry.fact.kind === "queue_completion" && entry.fact.completion.actorId === context.roles["ready-producer"]
    );
  const original = context.result.presetInitialQueueItems;
  const reinforcements = output.filter((entry) => original.some((item) => item.itemId === entry.item.itemId));
  const expectedQueueCount = branch === "no_safe_route" ? 1 : 4;
  if (original.length !== expectedQueueCount || reinforcements.length !== expectedQueueCount)
    failures.push("recovery_expected_paid_reinforcements_missing");
  const ids = reinforcements.flatMap((entry) => (entry.actor.actorId ? [entry.actor.actorId] : []));
  const seen = context.frames.find((frame) =>
    frame.decision.input?.observation?.actors.some(
      (actor) =>
        actor.visibility === "visible" &&
        actor.combatProfile?.status === "known" &&
        actor.combatProfile.value.attacks.some((attack) => attack.damage > 0) &&
        Object.entries(context.roles).some(([role, id]) => role.startsWith("choke-guard-") && id === actor.actorId)
    )
  );
  if (!seen) failures.push("recovery_lethal_reinforcement_route_never_fairly_known");
  const nativeDeaths = context.facts.filter(
    (fact) =>
      fact.kind === "native_damage" &&
      fact.damage.initiator?.playerNumber === 1 &&
      fact.damage.target.actorId &&
      ids.includes(fact.damage.target.actorId) &&
      !fact.damage.target.alive
  );
  if (nativeDeaths.length > 1) failures.push("recovery_repeated_native_one_unit_reinforcement_losses");
  const chokeGuardIds = Object.entries(context.roles)
    .filter(([role]) => role.startsWith("choke-guard-"))
    .map(([, actorId]) => actorId);
  if (branch === "grouping" && !context.frames.some((frame) => nativeRecoveryGroupAtThreat(frame, ids, chokeGuardIds)))
    failures.push("recovery_reinforcements_never_physically_grouped_at_choke");
  if (
    branch === "safe_alternate" &&
    !ids.some((id) =>
      context
        .arrived(id)
        .some((movement) =>
          movement.observations.some(
            (entry) => entry.spatial.actualTile && entry.spatial.actualTile.x <= 23 && entry.spatial.actualTile.y >= 37
          )
        )
    )
  )
    failures.push("recovery_reinforcements_never_used_native_safe_alternate");
  if (
    branch === "no_safe_route" &&
    (!ids.some((id) => nativeRetainedActor(context, id)) ||
      output.length !== original.length ||
      (context.result.checkpoints
        ?.at(-1)
        ?.militaryProducerQueues.find((producer) => producer.actorId === context.roles["ready-producer"])?.queuedItems
        .length ?? 0) > 0 ||
      !nativeRecoveryNoSafeWindowClear(context.frames, ids, chokeGuardIds))
  )
    failures.push("recovery_no_safe_route_kept_feeding_or_lost_all_outputs");
  if (
    branch === "threat_clears" &&
    (context.result.perturbations.filter((event) => event.id.startsWith("loss-choke-guard-") && event.tick === 200)
      .length !== 4 ||
      !ids.some((id) => context.arrived(id, 420).length))
  )
    failures.push("recovery_cleared_route_not_natively_reused");
  if (
    !nativeWeaponHits(context).some(
      (fact) =>
        fact.kind === "native_damage" &&
        (fact.damage.target.actorId === context.roles["mission-target"] ||
          chokeGuardIds.includes(fact.damage.target.actorId ?? "")) &&
        Object.entries(context.roles).some(
          ([role, id]) => role.startsWith("army-") && id === fact.damage.initiator?.actorId
        )
    )
  )
    failures.push("recovery_original_main_front_lost_useful_effect");
  return failures;
}

/** Require the late restraint window before concluding no lone unit entered the known threat. */
export function nativeRecoveryNoSafeWindowClear(
  frames: readonly NativeMissionRecoveryFrame[],
  reinforcementIds: readonly string[],
  threatIds: readonly string[]
): boolean {
  const lateFrames = frames.filter((frame) => frame.tick >= 400);
  return (
    lateFrames.length > 0 &&
    lateFrames.every((frame) => {
      if (nativeRecoveryIsolatedAtKnownThreat(frame, reinforcementIds, threatIds)) return false;
      const boundary = frame.tacticalBoundary?.actors ?? [];
      const observed = frame.decision.input?.observation?.actors ?? [];
      const threats = boundary.filter(
        (actor) =>
          threatIds.includes(actor.identity.actorId ?? "") &&
          actor.tile &&
          observed.some((item) => item.actorId === actor.identity.actorId && item.visibility === "visible")
      );
      return reinforcementIds.every((id) => {
        const actor = boundary.find((item) => item.identity.actorId === id && item.identity.alive);
        const observation = observed.find((item) => item.actorId === id);
        if (!actor?.tile || !observation || observation.activeOrder?.status !== "known" || threats.length === 0)
          return false;
        const order = observation.activeOrder.value;
        if (!order) return true;
        if (order.orderType !== "Move" || !order.targetPosition) return false;
        return threats.every((threat) => {
          const tile = threat.tile!;
          return (
            Math.hypot(order.targetPosition!.x - tile.x, order.targetPosition!.y - tile.y) >=
            Math.hypot(actor.tile!.x - tile.x, actor.tile!.y - tile.y)
          );
        });
      });
    })
  );
}

/** A grouped response may hold at the defended choke while engaging a tower instead of walking into its firing lane. */
export function nativeRecoveryGroupAtThreat(
  frame: NativeMissionRecoveryFrame,
  reinforcementIds: readonly string[],
  threatIds: readonly string[]
) {
  const actors = frame.tacticalBoundary?.actors ?? [],
    observedActors = frame.decision.input?.observation?.actors ?? [],
    visible = new Set(observedActors.filter((actor) => actor.visibility === "visible").map((actor) => actor.actorId));
  return actors.some((threat) => {
    if (
      !threat.identity.actorId ||
      !threatIds.includes(threat.identity.actorId) ||
      !visible.has(threat.identity.actorId)
    )
      return false;
    const target = threat.identity.actorId,
      threatObservation = observedActors.find((actor) => actor.actorId === target),
      weaponRange =
        threatObservation?.combatProfile?.status === "known"
          ? Math.max(
              0,
              ...threatObservation.combatProfile.value.attacks.map(
                (attack) => attack.range + attack.highGroundRangeBonus
              )
            )
          : 0,
      engagementRadius = Math.max(10, weaponRange + 2),
      attackingIds = new Set(
        observedActors
          .filter(
            (actor) =>
              actor.activeOrder?.status === "known" &&
              actor.activeOrder.value?.orderType === "Attack" &&
              actor.activeOrder.value.targetActorId === target
          )
          .map((actor) => actor.actorId)
      );
    return (
      actors.filter(
        (actor) =>
          !!actor.identity.actorId &&
          reinforcementIds.includes(actor.identity.actorId) &&
          attackingIds.has(actor.identity.actorId) &&
          actor.identity.alive &&
          !!actor.tile &&
          !!threat.tile &&
          Math.hypot(actor.tile.x - threat.tile.x, actor.tile.y - threat.tile.y) <= engagementRadius
      ).length >= 3
    );
  });
}

function nativeRecoveryIsolatedAtKnownThreat(
  frame: NativeMissionRecoveryFrame,
  reinforcementIds: readonly string[],
  threatIds: readonly string[]
) {
  const actors = frame.tacticalBoundary?.actors ?? [],
    visible = new Set(
      frame.decision.input?.observation?.actors
        .filter((actor) => actor.visibility === "visible")
        .map((actor) => actor.actorId) ?? []
    );
  return actors.some((threat) => {
    if (
      !threat.identity.actorId ||
      !threatIds.includes(threat.identity.actorId) ||
      !visible.has(threat.identity.actorId)
    )
      return false;
    const observedThreat = frame.decision.input?.observation?.actors.find(
      (actor) => actor.actorId === threat.identity.actorId
    );
    const range =
      observedThreat?.combatProfile?.status === "known"
        ? Math.max(
            1,
            ...observedThreat.combatProfile.value.attacks.map((attack) => attack.range + attack.highGroundRangeBonus)
          )
        : 1;
    return (
      actors.filter(
        (actor) =>
          !!actor.identity.actorId &&
          reinforcementIds.includes(actor.identity.actorId) &&
          actor.identity.alive &&
          !!actor.tile &&
          !!threat.tile &&
          Math.hypot(actor.tile.x - threat.tile.x, actor.tile.y - threat.tile.y) <= range
      ).length === 1
    );
  });
}
