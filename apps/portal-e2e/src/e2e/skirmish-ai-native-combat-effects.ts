import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";

/** Exact, positive native damage by a selected actor; the engine event is the physical outcome authority. */
export function nativePhysicalDamageFromActor(
  context: ReturnType<typeof nativeScenarioContext>,
  actorId: string | undefined,
  targetId: string | undefined,
  fromTick = 0
) {
  if (!actorId || !targetId) return [];
  return context.facts.filter((fact) =>
    fact.kind === "native_damage" &&
    fact.tick >= fromTick &&
    fact.damage.initiator?.playerNumber === 2 &&
    fact.damage.initiator.actorId === actorId &&
    fact.damage.target.actorId === targetId &&
    fact.damage.amount > 0 &&
    fact.damage.damageTick === fact.tick &&
    fact.damage.sceneActive &&
    fact.damage.targetInCaptureScene &&
    fact.damage.initiatorInCaptureScene &&
    !fact.damage.snapshotRestoreInProgress
  );
}

/** Actual native weapon start, compatible range/domain and positive damage; reserved/expected damage never counts. */
export function nativeWeaponHits(context: ReturnType<typeof nativeScenarioContext>, targetId?: string, fromTick = 0) {
  const requested = context.facts.flatMap((fact) => fact.kind === "native_combat" && fact.operation.kind === "attack_requested"
    ? [{ fact, value: fact.operation }] : []);
  const startsByTarget = new Map<string, typeof requested>();
  const commits = new Map<string, number[]>(), casterSince = new Map<string, number>();
  const targetKey = (actor: string | null, target: string | null) => JSON.stringify([actor, target]);
  for (const start of requested) {
    const key = targetKey(start.value.actor.actorId, start.value.target.actorId);
    const values = startsByTarget.get(key) ?? [];
    values.push(start);
    startsByTarget.set(key, values);
  }
  for (const fact of context.facts) {
    if (fact.kind !== "native_combat") continue;
    const value = fact.operation;
    if (value.kind === "spell_cooldown_started" && value.actor.actorId)
      casterSince.set(value.actor.actorId, Math.min(casterSince.get(value.actor.actorId) ?? Infinity, fact.tick));
    if (value.kind !== "attack_committed") continue;
    const key = JSON.stringify([value.actor.actorId, value.target.actorId, fact.tick, value.weapon]);
    commits.set(key, [...(commits.get(key) ?? []), fact.sequence]);
  }
  return context.facts.filter((fact) => {
    if (fact.kind !== "native_damage" || fact.tick < fromTick || fact.damage.initiator?.playerNumber !== 2 ||
        !fact.damage.initiator.actorId || !fact.damage.target.actorId ||
        targetId && fact.damage.target.actorId !== targetId || fact.damage.amount <= 0 || fact.damage.damageTick !== fact.tick ||
        !fact.damage.sceneActive || !fact.damage.targetInCaptureScene || !fact.damage.initiatorInCaptureScene ||
        fact.damage.snapshotRestoreInProgress) return false;
    // Spell/weapon ambiguity is unavailable, even when an old windup happens to have the same initiator and damage amount.
    if ((casterSince.get(fact.damage.initiator.actorId) ?? Infinity) <= fact.tick) return false;
    const starts = (startsByTarget.get(targetKey(fact.damage.initiator.actorId, fact.damage.target.actorId)) ?? []).filter((entry) => {
      const { fact: start, value } = entry;
      return value.actor.actorId === fact.damage.initiator?.actorId && value.target.actorId === fact.damage.target.actorId &&
        value.clockTick === start.tick && !value.snapshotRestoreInProgress && value.sceneActive && value.actor.alive &&
        value.actor.indexed && !value.stunned && !value.gaps.length && start.sequence < fact.sequence && start.tick <= fact.tick &&
        value.distance !== null && value.distance >= value.weapon.minRange &&
        value.distance <= value.weapon.range + value.highGroundRangeBonus && (!value.targetFlying || value.weapon.canTargetAir) &&
        value.weapon.damageType === fact.damage.damageType && value.weapon.damage === fact.damage.amount &&
        fact.tick - start.tick >= Math.ceil((value.weapon.projectile ? value.weapon.delays.fire : value.weapon.delays.hit) / 50) &&
        fact.tick - start.tick < Math.ceil(value.weapon.cooldown / 50) &&
        (commits.get(JSON.stringify([value.actor.actorId, value.target.actorId, start.tick, value.weapon])) ?? [])
          .some((sequence) => sequence > start.sequence);
    });
    return starts.length === 1;
  });
}

/** Legal, living original actor at the closed horizon; disappearance is never preservation. */
export function nativeRetainedActor(context: ReturnType<typeof nativeScenarioContext>, actorId?: string) {
  return context.capture?.frontiers?.intervals.at(-1)?.actors.some(({ identity }) =>
    identity.actorId === actorId && identity.active && identity.alive && identity.indexed && identity.finished) ?? false;
}

/** An actual selected retreat order must physically complete, followed by a living owned unit at the horizon. */
export function nativeRetreats(context: ReturnType<typeof nativeScenarioContext>, afterTick: number) {
  return context.frames.flatMap((frame) => (frame.decision.missionState?.squads ?? []).flatMap((squad) => {
    if (frame.tick < afterTick || !["retreat", "retreating", "regroup", "recover", "recovering"].includes(squad.state)) return [];
    return squad.actorIds.flatMap((id) => nativeRetainedActor(context, id) ? context.arrived(id, frame.tick).filter((movement) =>
      frame.decision.acceptedIntents.some((intent) => (intent.kind === "move" || intent.kind === "scout") &&
        intent.actorIds.includes(id) && intent.effectId.replace(/^effect:/, "") ===
          movement.observations[0]?.spatial.caller?.order?.commandContext?.execution.effectId)) : []);
  }));
}
