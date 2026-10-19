import { StatusEffectType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeRetainedActor, nativeRetreats, nativeWeaponHits } from "./skirmish-ai-native-combat-effects";

/** Tactical outcomes require native operations and physical recovery, not stance/script strings alone. */
export function evaluateNativeCombat(id: string, branch: string, context: ReturnType<typeof nativeScenarioContext>): string[] {
  const failures: string[] = [], target = context.roles["contact-group"], ranged = context.roles["ranged-probe"];
  const operations = context.facts.flatMap((fact) => fact.kind === "native_combat" ? [{ fact, value: fact.operation }] : []);
  if (operations.some(({ fact, value }) => value.clockTick !== fact.tick || !value.sceneActive ||
      value.snapshotRestoreInProgress || value.gaps.length)) failures.push("combat_native_operation_boundary_invalid");
  if (operations.some(({ value }) => value.kind === "attack_committed" && value.actor.playerNumber === 2 &&
      (value.stunned || value.distance === null || value.distance < value.weapon.minRange ||
       value.distance > value.weapon.range + value.highGroundRangeBonus || value.targetFlying && !value.weapon.canTargetAir)))
    failures.push("combat_attack_started_with_illegal_status_range_or_domain");
  if (id === "FIGHT-01") {
    if (!nativeWeaponHits(context, target).some((fact) => fact.tick < 400)) failures.push("combat_initial_favorable_fight_missing");
    if (branch !== "quiet" && !nativeRetreats(context, 400).length) failures.push("combat_changed_risk_has_no_physical_regroup");
    if (branch === "quiet" && !nativeWeaponHits(context, target, 400).length)
      failures.push("combat_favorable_control_did_not_continue_useful_fighting");
  }
  if (id === "FIGHT-02") {
    const initial = context.frames[0]?.tacticalBoundary?.actors.find((actor) => actor.identity.actorId === ranged);
    if (!initial || initial.combat?.status !== "known" || initial.health === null ||
        initial.health > initial.combat.value.maxHealth * 0.45) failures.push("combat_damaged_ranged_premise_missing");
    if (!nativeRetainedActor(context, ranged) || !context.arrived(ranged, 200).length)
      failures.push("combat_valuable_actor_not_physically_preserved");
    if (!nativeWeaponHits(context, undefined, 200).some((fact) =>
      fact.kind === "native_damage" && fact.damage.initiator?.actorId === ranged)) failures.push("combat_preserved_actor_no_useful_shot");
    const starts = operations.filter(({ value }) => value.kind === "attack_requested" && value.actor.actorId === ranged);
    const hits = nativeWeaponHits(context).filter((fact) => fact.kind === "native_damage" && fact.damage.initiator?.actorId === ranged);
    if (starts.length > hits.length * 3 + 2) failures.push("combat_excessive_cancelled_windups");
  }
  if (id === "FIGHT-03") failures.push(...evaluateNativeFronts(branch, context));
  if (id === "RAID-01") {
    const raiders = context.frames.flatMap((frame) => (frame.decision.missionState?.squads ?? []).filter((squad) =>
      squad.role === "attack" && squad.actorIds.length > 0 && squad.actorIds.length <= 4 &&
      squad.tactics?.targetActorId === target));
    if (branch !== "protected" && (!raiders.length || !nativeWeaponHits(context, target).length ||
        !raiders.some((squad) => squad.actorIds.some((actorId) => context.arrived(actorId).length))))
      failures.push("raid_limited_suitable_squad_has_no_native_harassment");
    if (branch === "protected" && context.frames.some((frame) => frame.decision.missionState?.squads.some((squad) =>
      squad.role === "attack" && squad.tactics?.targetActorId === target && squad.actorIds.length >= 8)))
      failures.push("raid_protected_low_value_target_drew_whole_force");
    const other = context.roles["front-target-a"];
    if (!nativeWeaponHits(context, other).length) failures.push("raid_main_objective_has_no_continuing_native_pressure");
  }
  if (id === "FIGHT-04") failures.push(...evaluateNativeSupport(branch, context));
  if (id === "FIGHT-05") {
    if (["stun", "slow"].includes(branch)) {
      const expected = branch === "stun" ? [StatusEffectType.Stunned, StatusEffectType.Frozen] : [StatusEffectType.Slowed];
      const applied = operations.find(({ value }) => value.kind === "status_applied" && value.actor.actorId === ranged &&
        expected.includes(value.effect.type));
      if (!applied || applied.value.kind !== "status_applied" || !applied.value.effect.sourceActorId)
        failures.push("combat_definition_backed_native_status_missing");
      else {
        const duration = Math.ceil(applied.value.effect.duration / 50), effect = applied.value.effect;
        const removed = operations.find(({ fact, value }) => fact.sequence > applied.fact.sequence &&
          value.kind === "status_removed" && value.actor.actorId === ranged && value.effectType === effect.type);
        if (!removed || removed.fact.tick < applied.fact.tick + duration - 1 ||
            removed.fact.tick > applied.fact.tick + duration + 1) failures.push("combat_native_status_duration_or_expiry_invalid");
        if (!context.arrived(ranged, removed?.fact.tick ?? Infinity).length &&
            !nativeWeaponHits(context, undefined, removed?.fact.tick ?? Infinity).some((fact) =>
              fact.kind === "native_damage" && fact.damage.initiator?.actorId === ranged))
          failures.push("combat_no_useful_recovery_after_native_status_expiry");
      }
    } else {
      const loss = context.result.perturbations.find((event) => event.id === "loss-contact-group" && event.tick === 400 &&
        event.affectedActorId === target);
      if (branch === "target_loss" && !loss) failures.push("combat_original_target_loss_not_applied");
      if (branch === "target_loss" && context.frames.some((frame) => frame.tick > 440 &&
        frame.decision.acceptedIntents.some((intent) => intent.kind === "attack" && intent.targetActorId === target)))
        failures.push("combat_dead_target_still_commanded");
      if (branch === "wall" && !context.facts.some((fact) => fact.kind === "spatial_authority" &&
        fact.spatial.kind === "placement" && fact.tick === 400 && fact.spatial.legal &&
        fact.spatial.command.execution?.source === "human" && fact.spatial.site.canonicalObjectName === "Wall"))
        failures.push("combat_real_shared_wall_blocker_missing");
      if (!context.frames.some((frame) => frame.tick > 400 && frame.tick <= 800 &&
        frame.decision.acceptedIntents.some((intent) => (intent.kind === "move" || intent.kind === "attack") &&
          (intent.kind !== "attack" || intent.targetActorId !== target)))) failures.push("combat_bounded_alternative_duty_missing");
      if (!nativeRetreats(context, 400).length && !nativeWeaponHits(context, context.roles["front-target-a"], 400).length)
        failures.push("combat_alternative_duty_has_no_native_effect");
    }
  }
  return [...new Set(failures)];
}

/** Independent targets need disjoint useful groups; weighted response is measured in real members and real hits. */
export function evaluateNativeFronts(branch: string, context: ReturnType<typeof nativeScenarioContext>): string[] {
  const a = context.roles["front-target-a"], b = context.roles["front-target-b"], failures: string[] = [];
  const pair = context.frames.find((frame) => {
    const squads = frame.decision.missionState?.squads ?? [];
    const left = squads.find((squad) => squad.tactics?.targetActorId === a && squad.actorIds.length);
    const right = squads.find((squad) => squad.tactics?.targetActorId === b && squad.actorIds.length);
    return left && right && !left.actorIds.some((id) => right.actorIds.includes(id));
  });
  if (!pair || !nativeWeaponHits(context, a).length || !nativeWeaponHits(context, b).length)
    failures.push("combat_independent_physically_useful_fronts_missing");
  if (["unequal", "escalated"].includes(branch)) {
    const responsive = context.frames.some((frame) => frame.tick > 400 && frame.tick <= 800 &&
      (frame.decision.missionState?.squads.find((squad) => squad.tactics?.targetActorId === a)?.actorIds.length ?? 0) >
      (frame.decision.missionState?.squads.find((squad) => squad.tactics?.targetActorId === b)?.actorIds.length ?? Infinity));
    if (!responsive) failures.push("combat_reinforcements_not_proportional_to_escalation");
  }
  if (branch === "infeasible" && (!nativeWeaponHits(context, b, 600).length || context.frames.some((frame) =>
    frame.tick > 800 && frame.decision.missionState?.squads.some((squad) => squad.tactics?.targetActorId === a &&
      !["completed", "cancelled", "retreat", "recover"].includes(squad.state)))))
    failures.push("combat_infeasible_front_not_released_independently");
  return failures;
}

/** Claims must settle into real effects and release on native expiry; declarative support capacity is insufficient. */
function evaluateNativeSupport(branch: string, context: ReturnType<typeof nativeScenarioContext>): string[] {
  const failures: string[] = [];
  const operations = context.facts.flatMap((fact) => fact.kind === "native_combat" ? [{ fact, value: fact.operation }] : []);
  if (branch === "overkill") {
    if (!nativeWeaponHits(context, context.roles["contact-group"]).length ||
        !nativeWeaponHits(context, context.roles["front-target-a"]).length) failures.push("combat_overkill_no_actual_target_distribution");
    for (const frame of context.frames) {
      const claims = frame.decision.missionState?.squads.flatMap((squad) => squad.tactics?.damageReservations ?? []) ?? [];
      for (const targetId of new Set(claims.map((claim) => claim.targetActorId))) {
        const hp = frame.tacticalBoundary?.actors.find((actor) => actor.identity.actorId === targetId);
        const values = claims.filter((claim) => claim.targetActorId === targetId && claim.impactTick >= frame.tick);
        const committed = values.reduce((sum, claim) => sum + claim.expectedDamage, 0);
        if (hp?.health !== null && hp?.health !== undefined && values.length > 1 &&
            committed - Math.max(...values.map((claim) => claim.expectedDamage)) >= hp.health + (hp.armour ?? 0))
          failures.push("combat_avoidable_overkill_still_reserved");
      }
    }
  } else {
    const applied = operations.filter(({ value }) => value.kind === "status_applied" &&
      value.effect.sourceActorId === context.roles["support-probe"] || value.kind === "heal_returned" &&
      value.actor.playerNumber === 2 && value.beforeHealth !== null && value.afterHealth !== null &&
      value.afterHealth > value.beforeHealth);
    if (!applied.length) failures.push("combat_support_has_no_native_applied_effect");
    if (!operations.some(({ value }) => value.kind === "spell_cooldown_started" &&
      value.actor.actorId === context.roles["support-probe"])) failures.push("combat_selected_caster_never_started_native_spell");
    for (const frame of context.frames) {
      const active = frame.decision.missionState?.support.filter((plan) => !["completed", "released"].includes(plan.state ?? "")) ?? [];
      if (active.some((plan) => plan.expiresAt && plan.expiresAt.dueTick < frame.tick))
        failures.push("combat_expired_support_still_owns_capacity");
      const effects = active.flatMap((plan) => plan.effectId ? [plan.effectId] : []);
      if (new Set(effects).size !== effects.length) failures.push("combat_pending_support_effect_reserved_twice");
    }
    if (branch === "zone" && !context.frames.some((frame) => frame.decision.input?.effects?.some((zone) =>
      zone.influence === "harmful" && zone.expiresAt.status === "known" && zone.expiresAt.value > frame.tick)))
      failures.push("combat_actual_harmful_zone_never_observed");
    if (branch === "support_expiry" && !context.facts.some((fact) => fact.kind === "actor_unregistered" &&
      fact.objectName.toLowerCase().includes("totem"))) failures.push("combat_temporary_support_native_expiry_missing");
  }
  return failures;
}
