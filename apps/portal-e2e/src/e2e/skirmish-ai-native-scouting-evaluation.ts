import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";

/** Player-scoped inputs are checked against independent native sight; privileged truth is never an AI target source. */
export function nativeScoutingFairness(context: ReturnType<typeof nativeScenarioContext>): string[] {
  const failures: string[] = [];
  const lastVisible = new Map<string, { tick: number; position: unknown }>();
  for (const frame of context.frames) {
    const observation = frame.decision.input?.observation, native = frame.tacticalBoundary;
    if (!observation || !native) continue;
    for (const actor of observation.actors.filter((actor) => actor.relation === "enemy")) {
      const truth = native.actors.find((entry) => entry.identity.actorId === actor.actorId);
      if (actor.visibility === "visible") {
        if (!truth?.visible || !truth.identity.alive || actor.observedTick !== frame.tick ||
            actor.logicalPosition.status !== "known" || !truth.tile ||
            actor.logicalPosition.value.x !== truth.tile.x || actor.logicalPosition.value.y !== truth.tile.y)
          failures.push("scouting_contact_not_native_visible");
        lastVisible.set(actor.actorId, { tick: actor.observedTick, position: actor.logicalPosition });
      } else {
        const prior = lastVisible.get(actor.actorId);
        if (!prior || actor.observedTick !== prior.tick || JSON.stringify(actor.logicalPosition) !== JSON.stringify(prior.position) ||
            actor.queue.status !== "unknown" || actor.effectiveLevel.status !== "unknown" ||
            actor.healthPermille?.status === "known" || actor.combatProfile?.status === "known" ||
            actor.resourceState.status !== "unknown" || actor.capabilities.length)
          failures.push("scouting_hidden_state_or_age_leaked");
      }
    }
    for (const intent of frame.decision.acceptedIntents) {
      const targetId = "targetActorId" in intent ? intent.targetActorId : null;
      if (intent.kind === "attack" && targetId && observation.actors.some((actor) =>
        actor.actorId === targetId && actor.relation === "enemy" && actor.visibility === "last_seen"))
        failures.push("scouting_hidden_actor_followed_by_live_identity");
      if (!targetId || observation.actors.some((actor) => actor.actorId === targetId)) continue;
      failures.push("scouting_unknown_identity_targeted");
    }
  }
  return [...new Set(failures)];
}

/** Physical original-destination arrival, selected scout effect and genuinely newly visible geography are all required. */
export function nativeScoutTrips(context: ReturnType<typeof nativeScenarioContext>, afterTick = 0) {
  return context.frames.flatMap((frame) => frame.decision.acceptedIntents.flatMap((intent) => {
    if (intent.kind !== "scout" || frame.tick < afterTick) return [];
    return intent.actorIds.flatMap((actorId) => context.arrived(actorId, frame.tick).flatMap((movement) => {
      if (movement.observations[0]?.spatial.caller?.order?.commandContext?.execution.effectId !== intent.effectId) return [];
      const arrival = movement.observations.find((entry) => entry.spatial.phase === "arrived");
      if (!arrival) return [];
      const unknown = frame.tacticalBoundary?.searchPoints.filter((point) => !point.visible) ?? [];
      const learned = context.frames.some((later) => later.tick >= arrival.tick && later.tick <= arrival.tick + 40 &&
        later.tacticalBoundary?.searchPoints.some((point) => point.visible && unknown.some((old) => old.pointId === point.pointId)));
      return learned ? [{ actorId, selectedTick: frame.tick, arrivalTick: arrival.tick, intent, movement }] : [];
    }));
  }));
}

/** Fixed per-ID predicates; missing prerequisites fail instead of turning a control into a vacuous pass. */
export function evaluateNativeScouting(
  scenarioId: string, branch: string, context: ReturnType<typeof nativeScenarioContext>
): string[] {
  const failures = nativeScoutingFairness(context);
  const targetId = context.role("contact-group"), scoutId = context.role("scout-probe");
  const visible = context.frames.filter((frame) => frame.decision.input?.observation?.actors.some((actor) =>
    actor.actorId === targetId && actor.visibility === "visible"));
  const remembered = context.frames.filter((frame) => frame.decision.input?.observation?.actors.some((actor) =>
    actor.actorId === targetId && actor.visibility === "last_seen"));
  const trips = nativeScoutTrips(context);
  if (!trips.length) failures.push("scouting_useful_physical_information_trip_missing");
  if (scenarioId === "SCOUT-01") {
    const first = visible[0];
    if (!targetId || !first || context.frames.filter((frame) => frame.tick < first.tick).length < 2)
      failures.push("scouting_hidden_start_then_native_contact_missing");
  }
  if (["SCOUT-02", "H-22"].includes(scenarioId)) {
    if (!visible.length || branch !== "visible" && !remembered.length)
      failures.push("scouting_original_contact_and_native_loss_missing");
    if (branch !== "visible" && branch !== "remains") {
      const stale = remembered.find((frame) => frame.tick - (frame.decision.input?.observation?.actors.find((actor) =>
        actor.actorId === targetId)?.observedTick ?? frame.tick) >= 720);
      const earlier = scenarioId === "SCOUT-02"
        ? visible[0]?.decision.economyProduction.adaptation.evidence.find((entry) => entry.sourceContactId === targetId)
        : visible[0]?.decision.missionState?.skirmish.incidents.find((entry) => entry.hostileActorIds.includes(targetId));
      const later = scenarioId === "SCOUT-02"
        ? stale?.decision.economyProduction.adaptation.evidence.find((entry) => entry.sourceContactId === targetId)
        : stale?.decision.missionState?.skirmish.incidents.find((entry) => entry.hostileActorIds.includes(targetId));
      if (!stale || !earlier || later && later.confidencePermille >= earlier.confidencePermille)
        failures.push("scouting_stale_certainty_did_not_decrease");
      if (!trips.some((trip) => trip.selectedTick >= (stale?.tick ?? Infinity)))
        failures.push("scouting_stale_information_job_not_served");
    }
  }
  if (scenarioId === "SCOUT-02" && branch !== "visible") {
    if (!context.opponent?.frontiers?.intervals.at(-1)?.actors.some(({ identity }) => identity.actorId === targetId &&
      identity.alive && identity.indexed)) failures.push("scouting_withdrawn_army_not_alive_at_horizon");
    if (branch === "hidden_health" && !context.facts.some((fact) => fact.kind === "native_damage" && fact.tick === 600 &&
      fact.damage.target.actorId === targetId && fact.damage.initiator === null && fact.damage.amount > 0))
      failures.push("scouting_hidden_health_control_never_changed_native_durability");
    if (branch === "hidden_queue" && !context.opponent?.facts.some((fact) => fact.kind === "queue_mutation" &&
      fact.tick >= 600 && fact.mutation.actorId === context.role("enemy-producer")))
      failures.push("scouting_hidden_queue_control_never_changed_native_queue");
  }
  if (scenarioId === "SCOUT-03") {
    const contact = visible[0];
    const threatened = contact?.tacticalBoundary?.actors.find((actor) => actor.identity.actorId === targetId);
    if (!contact || !scoutId || threatened?.combat?.status !== "known" || !threatened.combat.value.attacks.length ||
        !context.facts.some((fact) => fact.kind === "preset_control" && fact.control.phase === "applied" &&
          fact.control.command?.type === "ACTOR_ACTION" && fact.control.command.targetObjectIds?.includes(scoutId)))
      failures.push("scouting_native_pursuit_missing");
    const escaped = context.arrived(scoutId, contact?.tick ?? Infinity).some((movement) => {
      const arrival = movement.observations.find((entry) => entry.spatial.phase === "arrived");
      if (!arrival) return false;
      return context.frames.some((frame) => frame.tick >= arrival.tick && frame.tick <= arrival.tick + 40 &&
        frame.tacticalBoundary?.actors.some((actor) => actor.identity.actorId === scoutId && actor.identity.alive) &&
        frame.tacticalBoundary.actors.some((actor) => actor.identity.actorId === targetId && !actor.visible));
    });
    if (branch === "escape" && !escaped) failures.push("scouting_surviving_physical_escape_missing");
    if (branch === "trapped" && !trips.some((trip) => trip.selectedTick > (contact?.tick ?? Infinity) + 100))
      failures.push("scouting_trapped_branch_has_no_bounded_alternative_information");
  }
  if (scenarioId === "SCOUT-04") {
    const discovery = visible[0];
    const before = context.frames.filter((frame) => frame.tick < (discovery?.tick ?? 0)).at(-1);
    const adapted = context.frames.find((frame) => frame.tick > (discovery?.tick ?? Infinity) &&
      frame.tick <= (discovery?.tick ?? 0) + 200 &&
      (frame.decision.strategy?.objectiveId !== before?.decision.strategy?.objectiveId ||
       frame.decision.missionState?.squads.some((squad) => squad.objectiveId?.includes(targetId))));
    if (!discovery || !before || !adapted || !context.damageTo(targetId, discovery.tick).length)
      failures.push("scouting_discovery_has_no_causal_useful_objective_response");
    if (branch === "approach" && !context.frames.some((frame) =>
      frame.decision.input?.accessGraph?.transferPoints.length)) failures.push("scouting_native_alternate_approach_missing");
  }
  if (scenarioId === "H-22" && branch !== "remains") {
    const clear = context.frames.find((frame) => frame.tacticalBoundary?.rememberedCoverage.some((entry) =>
      entry.actorId === targetId && entry.tiles.length === 25 && entry.tiles.every((tile) => tile.visible)));
    const retired = clear && context.frames.find((frame) => frame.tick > clear.tick &&
      !frame.decision.missionState?.skirmish.incidents.some((incident) => incident.hostileActorIds.includes(targetId)) &&
      !frame.decision.input?.observation?.actors.some((actor) => actor.actorId === targetId && actor.visibility === "last_seen"));
    if (!clear || !retired || !trips.some((trip) => trip.selectedTick > retired.tick))
      failures.push("scouting_cleared_hypothesis_not_retired_then_search_continued");
  }
  if (scenarioId === "H-22" && branch === "remains" && !visible.some((frame) => frame.tick > 400))
    failures.push("scouting_remaining_enemy_not_rediscovered");
  return [...new Set(failures)];
}
