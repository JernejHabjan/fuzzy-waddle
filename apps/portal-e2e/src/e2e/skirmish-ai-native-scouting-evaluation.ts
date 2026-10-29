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

/** Physical progress toward the selected sample, its scout effect and new search information are all required. */
export function nativeScoutTrips(context: ReturnType<typeof nativeScenarioContext>, afterTick = 0) {
  return context.frames.flatMap((frame) => frame.decision.acceptedIntents.flatMap((intent) => {
    if (intent.kind !== "scout" || !intent.planId || frame.tick < afterTick) return [];
    return intent.actorIds.flatMap((actorId) => {
      const squadId = intent.planId.replace(/^plan:/, "");
      const selectedEffectId = intent.effectId.replace(/^effect:/, "");
      const movements = [
        ...context.arrived(actorId, frame.tick).flatMap((movement) => {
          const executionEffectId = movement.observations[0]?.spatial.caller?.order?.commandContext?.execution.effectId;
          if (
            executionEffectId !== selectedEffectId &&
            !executionEffectId?.startsWith(`stage13:${squadId}:search:${actorId}:`)
          )
            return [];
          const arrival = movement.observations.find((entry) => entry.spatial.phase === "arrived");
          return arrival ? [{
            executionId: movement.observations[0]?.spatial.executionId,
            startedTick: movement.started.tick,
            arrivalTick: arrival.tick,
            movement
          }] : [];
        }),
        ...nativeScoutMovesStoppedAtDestination(context, actorId, frame.tick).flatMap((movement) => {
          const executionEffectId = movement.executionEffectId;
          return executionEffectId === selectedEffectId ||
            executionEffectId?.startsWith(`stage13:${squadId}:search:${actorId}:`)
            ? [{ executionId: movement.executionId, startedTick: movement.startedTick,
                arrivalTick: movement.arrivalTick, movement }]
            : [];
        }),
        ...nativeScoutMovesWithPhysicalProgress(context, actorId, frame.tick).flatMap((movement) => {
          const executionEffectId = movement.executionEffectId;
          return executionEffectId === selectedEffectId ||
            executionEffectId?.startsWith(`stage13:${squadId}:search:${actorId}:`)
            ? [{ executionId: movement.executionId, startedTick: movement.startedTick,
                arrivalTick: movement.progressTick, movement }]
            : [];
        })
      ];
      const uniqueMovements = new Map<number, (typeof movements)[number]>();
      for (const movement of movements) {
        if (movement.executionId !== undefined && !uniqueMovements.has(movement.executionId))
          uniqueMovements.set(movement.executionId, movement);
      }
      return [...uniqueMovements.values()].flatMap((movement) => {
        const latestSelection = context.frames.flatMap((candidate) => candidate.decision.acceptedIntents
          .filter((candidateIntent) => candidateIntent.kind === "scout" && candidateIntent.planId === intent.planId &&
            candidateIntent.actorIds.includes(actorId) && candidate.tick <= movement.startedTick)
          .map(() => candidate.tick)).at(-1);
        if (latestSelection !== frame.tick) return [];
        const unknown = frame.tacticalBoundary?.searchPoints.filter((point) => !point.visible) ?? [];
        const learned = context.frames.some((later) => later.tick >= movement.startedTick &&
          later.tick <= movement.arrivalTick + 40 &&
          later.tacticalBoundary?.searchPoints.some((point) => point.visible && unknown.some((old) => old.pointId === point.pointId)));
        return learned ? [{ actorId, selectedTick: frame.tick, arrivalTick: movement.arrivalTick, intent, movement }] : [];
      });
    });
  }));
}

/** Counts a physically verified stop on the original destination when a same-tick replacement closes the order first. */
function nativeScoutMovesStoppedAtDestination(
  context: ReturnType<typeof nativeScenarioContext>,
  actorId: string,
  afterTick: number
) {
  const groups = new Map<number, typeof context.capture.facts>();
  for (const fact of context.capture?.facts ?? []) {
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "movement" || fact.tick < afterTick ||
      fact.spatial.source.actorId !== actorId) continue;
    const group = groups.get(fact.spatial.executionId) ?? [];
    group.push(fact);
    groups.set(fact.spatial.executionId, group);
  }
  return [...groups.values()].flatMap((facts) => {
    const started = facts.find((fact) => fact.spatial.phase === "started");
    const stopped = facts.find((fact) => fact.spatial.phase === "stopped");
    if (!started || started.kind !== "spatial_authority" || started.spatial.kind !== "movement" ||
      !stopped || stopped.kind !== "spatial_authority" || stopped.spatial.kind !== "movement" ||
      started.spatial.gaps.length || stopped.spatial.gaps.length ||
      started.spatial.caller?.order?.commandContext?.execution.source !== "ai" ||
      !started.spatial.originalDestination ||
      JSON.stringify(started.spatial.originalDestination) !== JSON.stringify(stopped.spatial.actualTile)) return [];
    return [{
      executionId: started.spatial.executionId,
      startedTick: started.tick,
      arrivalTick: stopped.tick,
      executionEffectId: started.spatial.caller.order.commandContext.execution.effectId,
      movement: { started, stopped }
    }];
  });
}

/** A scout may reveal a search cell while traversing toward its representative tile before native pathing stops. */
function nativeScoutMovesWithPhysicalProgress(
  context: ReturnType<typeof nativeScenarioContext>,
  actorId: string,
  afterTick: number
) {
  const groups = new Map<number, typeof context.capture.facts>();
  for (const fact of context.capture?.facts ?? []) {
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "movement" || fact.tick < afterTick ||
      fact.spatial.source.actorId !== actorId) continue;
    const group = groups.get(fact.spatial.executionId) ?? [];
    group.push(fact);
    groups.set(fact.spatial.executionId, group);
  }
  return [...groups.values()].flatMap((facts) => {
    const started = facts.find((fact) => fact.kind === "spatial_authority" && fact.spatial.phase === "started");
    if (!started || started.kind !== "spatial_authority" || started.spatial.kind !== "movement" ||
      started.spatial.gaps.length || started.spatial.caller?.order?.commandContext?.execution.source !== "ai" ||
      !started.spatial.originalDestination || !started.spatial.actualTile) return [];
    const progress = facts.find((fact) => fact.kind === "spatial_authority" &&
      (fact.spatial.phase === "stopped" || fact.spatial.phase === "returned_false") && fact.spatial.actualTile &&
      (fact.spatial.actualTile.x !== started.spatial.actualTile?.x ||
        fact.spatial.actualTile.y !== started.spatial.actualTile?.y));
    if (!progress || progress.tick <= started.tick || progress.kind !== "spatial_authority" ||
      progress.spatial.kind !== "movement" ||
      progress.spatial.gaps.length) return [];
    return [{
      executionId: started.spatial.executionId,
      startedTick: started.tick,
      progressTick: progress.tick,
      executionEffectId: started.spatial.caller.order.commandContext.execution.effectId
    }];
  });
}

/** A newly observed target counts as considered even when a higher-priority committed attack remains selected. */
export function nativeScoutingObjectiveResponse(
  decision: {
    readonly strategy?: {
      readonly objectiveId?: string | null;
      readonly assessment?: {
        readonly targetActorId?: string | null;
        readonly alternatives?: readonly { readonly targetActorId: string }[];
      } | null;
    } | null;
    readonly missionState?: {
      readonly squads?: readonly { readonly objectiveId?: string | null }[];
    } | null;
  },
  targetActorId: string
): boolean {
  return (
    decision.strategy?.objectiveId === targetActorId ||
    decision.strategy?.assessment?.targetActorId === targetActorId ||
    decision.strategy?.assessment?.alternatives?.some((alternative) => alternative.targetActorId === targetActorId) === true ||
    decision.missionState?.squads?.some((squad) => squad.objectiveId?.includes(targetActorId)) === true
  );
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
    const considered = context.frames.find((frame) => frame.tick > (discovery?.tick ?? Infinity) &&
      // Strategy refresh can need two simulation decision cycles after sighting.
      frame.tick <= (discovery?.tick ?? 0) + 400 &&
      nativeScoutingObjectiveResponse(frame.decision, targetId));
    const usefulNativeEffect = discovery && context.damageTo(targetId, discovery.tick).some((fact) =>
      fact.kind === "native_damage" && fact.damage.initiator?.playerNumber === context.capture?.playerNumber);
    if (!discovery || !before || !considered || !usefulNativeEffect)
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
