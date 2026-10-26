import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeRetreats, nativeWeaponHits } from "./skirmish-ai-native-combat-effects";
import { evaluateNativeFronts } from "./skirmish-ai-native-combat-evaluation";
import { hasNativeSourceDelivery } from "./skirmish-ai-source-delivery";

/** Strategic labels must agree with permitted changes and produce native objective effects. */
export function evaluateNativeStrategy(id: string, branch: string, context: ReturnType<typeof nativeScenarioContext>): string[] {
  const failures: string[] = [], target = context.role("contact-group");
  const before = context.frames.filter((frame) => frame.tick < 400).at(-1), after = context.frames.filter((frame) => frame.tick >= 400);
  const mainMission = before?.decision.missionState?.squads.find((squad) => squad.role === "attack" && squad.actorIds.length);
  const offensiveEffect = nativeWeaponHits(context, target, 400).length > 0;
  if (id === "STRAT-04") {
    if (!mainMission?.lifecycle || !before?.decision.strategy?.goalId) failures.push("strategy_committed_mission_premise_missing");
    if (branch !== "real_threat") {
      if (!offensiveEffect || !after.some((frame) => frame.decision.missionState?.squads.some((squad) =>
        squad.squadId === mainMission?.squadId && squad.objectiveId === mainMission.objectiveId &&
        squad.lifecycle?.createdTick === mainMission.lifecycle?.createdTick &&
        squad.lifecycle?.effectDeadline.dueTick === mainMission.lifecycle?.effectDeadline.dueTick)))
        failures.push("strategy_minor_noise_reset_commitment_or_stopped_useful_offense");
      if (branch === "noise" && !after.some((frame) => frame.decision.input?.observation?.actors.some((actor) =>
        actor.actorId === context.role("noise-scout") && actor.visibility === "visible")))
        failures.push("strategy_noise_control_never_legitimately_seen");
    } else if (!nativeRetreats(context, 400).length) failures.push("strategy_real_threat_control_never_adapted_physically");
  }
  if (id === "STRAT-05") {
    if (!nativeWeaponHits(context, target).some((fact) => fact.tick < 400)) failures.push("strategy_initial_offensive_effect_missing");
    const quietContinuation = [target, context.role("front-target-a"), context.role("front-target-b")]
      .some((actorId) => nativeWeaponHits(context, actorId, 400).length > 0);
    if (branch === "quiet" ? !quietContinuation : !nativeRetreats(context, 400).length)
      failures.push("strategy_counterforce_reassessment_or_control_continuation_missing");
    if (branch !== "quiet") {
      const discovery = after.find((frame) => frame.decision.input?.observation?.actors.filter((actor) =>
        actor.relation === "enemy" && actor.visibility === "visible" &&
        Object.entries(context.roles).some(([role, id]) => role.startsWith("reinforcement-") && id === actor.actorId)).length);
      if (!discovery || !after.some((frame) => frame.tick > discovery.tick && frame.tick <= discovery.tick + 400 &&
        (frame.decision.strategy?.objectiveId !== before?.decision.strategy?.objectiveId ||
         frame.decision.acceptedIntents.some((intent) => intent.kind === "produce"))))
        failures.push("strategy_counterforce_no_fair_future_plan_response");
    }
  }
  if (id === "STRAT-06") {
    const decisions = context.frames.filter((frame) => frame.tick >= 200 && frame.tick <= 600);
    if (branch === "strong" && !decisions.some((frame) => ["pressure", "finish", "expand"].includes(
      frame.decision.strategy?.stance ?? ""))) failures.push("strategy_strong_world_did_not_use_readiness");
    if (branch === "damaged" && (!context.result.perturbations.filter((event) => event.id.startsWith("loss-worker-")).length ||
        !decisions.some((frame) => ["recover", "stabilize", "defend"].includes(frame.decision.strategy?.stance ?? ""))))
      failures.push("strategy_damaged_world_did_not_prioritize_recovery");
    if (branch === "strong" && !offensiveEffect) failures.push("strategy_strong_world_has_no_native_pressure");
  }
  if (id === "STRAT-07") {
    const opportunity = context.frames.find((frame) => (branch !== "breach" || frame.tick >= 400) &&
      frame.decision.input?.observation?.actors.some((actor) =>
      actor.actorId === target && actor.visibility === "visible"));
    if (!opportunity) failures.push("strategy_native_visible_opportunity_missing");
    if (branch !== "defended" && !nativeWeaponHits(context, target).some((fact) =>
      fact.tick >= (opportunity?.tick ?? Infinity) && fact.tick <= (opportunity?.tick ?? 0) + 1200))
      failures.push("strategy_valuable_opportunity_has_no_bounded_native_effect");
    if (branch === "unfinished" && !context.result.productionPreset?.constructionApplications?.some((application) =>
      application.siteActorId === target)) failures.push("strategy_real_unfinished_producer_missing");
    if (branch === "breach" && (!context.result.perturbations.some((event) => event.id === "loss-opportunity-wall" &&
        event.tick === 400 && event.affectedActorId === context.role("opportunity-wall")) ||
        !context.frames.some((frame) => frame.tick >= 400 && frame.tacticalBoundary?.actors.some((actor) =>
          actor.identity.playerNumber === 2 && actor.identity.alive && actor.tile && actor.tile.x < 27 &&
          actor.tile.x > 18 && actor.tile.y > 18 && actor.tile.y < 30))))
      failures.push("strategy_opened_native_breach_never_physically_exploited");
  }
  if (id === "STRAT-10") failures.push(...evaluateNativeStrategicRecovery(branch, context));
  if (id === "STRAT-11") {
    const topology = context.capture?.setup?.topology;
    if (branch === "bridge" && !topology?.some((layer) => layer.cells.some((cell) =>
      JSON.stringify(cell.properties).includes('"water"')))) failures.push("strategy_real_choke_terrain_missing");
    const useful = nativeWeaponHits(context, context.role("front-target-a")).length;
    if (branch !== "irrelevant" && (!useful || !context.frames.some((frame) => frame.tacticalBoundary?.actors.some((actor) =>
      actor.identity.playerNumber === 2 && actor.identity.alive && actor.tile && actor.tile.x >= 24 && actor.tile.x <= 26 &&
      actor.tile.y >= 20 && actor.tile.y <= 25)))) failures.push("strategy_valuable_position_not_physically_controlled");
    if (branch === "irrelevant" && context.frames.some((frame) => frame.decision.acceptedIntents.some((intent) =>
      intent.kind === "construct" && ["Wall", "WatchTower", "Stairs"].includes(intent.objectName) &&
      intent.logicalPosition.x < 12 && intent.logicalPosition.y < 12))) failures.push("strategy_irrelevant_remote_terrain_funded");
  }
  if (id === "STRAT-12") {
    if (branch !== "unused") {
      const delivered = hasNativeSourceDelivery(context.opponent?.facts ?? [], {
        sourceActorId: context.role("enemy-source"), sourceOwner: null, playerNumber: 1, resourceType: ResourceType.Wood,
        fromTick: 0, throughTick: 400, workerActorId: context.role("enemy-worker"), depositActorId: context.role("enemy-deposit")
      });
      if (!delivered) failures.push("strategy_enemy_dependency_has_no_native_service");
      if (!nativeWeaponHits(context, context.role("enemy-deposit")).length &&
          !nativeWeaponHits(context, context.role("enemy-worker")).length) failures.push("strategy_dependency_denial_no_actual_effect");
    }
    if (branch === "own_threat") {
      const deposit = context.role("own-deposit");
      if (!context.facts.some((fact) => fact.kind === "native_damage" && fact.damage.target.actorId === deposit &&
        fact.damage.initiator?.playerNumber === 1 && fact.damage.amount > 0)) failures.push("strategy_own_dependency_never_threatened");
      if (!context.frames.some((frame) => frame.tick > 400 && frame.tick <= 800 &&
        frame.decision.missionState?.squads.some((squad) => squad.role === "defense" && squad.actorIds.length > 0 &&
          squad.actorIds.length < 8)) || !context.capture?.frontiers?.intervals.at(-1)?.actors.some(({ identity }) =>
        identity.actorId === deposit && identity.alive && identity.indexed))
        failures.push("strategy_essential_service_not_proportionately_defended");
    }
  }
  if (id === "STRAT-13") failures.push(...evaluateNativeFronts(branch, context));
  return [...new Set(failures)];
}

/** Paid replacement, native ready workforce and delivered income must precede resumed unsupported aggression. */
function evaluateNativeStrategicRecovery(branch: string, context: ReturnType<typeof nativeScenarioContext>): string[] {
  if (branch === "intact") return nativeWeaponHits(context).length ? [] : ["strategy_intact_control_has_no_native_offense"];
  const failures: string[] = [];
  const expected = ["ready-producer", ...Array.from({ length: 4 }, (_, i) => `worker-${i}`),
    ...Array.from({ length: 5 }, (_, i) => `army-${i}`)];
  if (expected.some((role) => !context.result.perturbations.some((event) => event.id === `loss-${role}` &&
    event.tick === 200 && event.affectedActorId === context.roles[role]))) failures.push("strategy_combined_original_loss_premise_missing");
  const ready = context.capture?.frontiers?.intervals.find((interval) => interval.closedFromTick >= 200 &&
    interval.actors.filter(({ identity }) => identity.alive && identity.finished && identity.indexed &&
      identity.canonicalObjectName === (context.result.aiFaction === "Tivara" ? "TivaraWorkerMale" : "SkaduweeWorkerMale")).length >= 6 &&
    interval.actors.some(({ identity }) => identity.alive && identity.finished && identity.indexed &&
      identity.canonicalObjectName === (context.result.aiFaction === "Tivara" ? "AnkGuard" : "InfantryInn") &&
      identity.actorId !== context.role("ready-producer")));
  if (!ready) failures.push("strategy_combined_loss_has_no_native_worker_and_producer_recovery");
  if (!hasNativeSourceDelivery(context.capture?.facts ?? [], {
    sourceActorId: context.role("own-source"), sourceOwner: null, playerNumber: 2, resourceType: ResourceType.Wood,
    fromTick: 200, throughTick: ready?.closedThroughTick ?? 4000, depositActorId: context.role("own-deposit")
  })) failures.push("strategy_recovery_has_no_native_delivered_income");
  if (context.frames.some((frame) => frame.tick > 200 && frame.tick < (ready?.closedThroughTick ?? Infinity) &&
    frame.decision.missionState?.squads.some((squad) => squad.role === "attack" && squad.state === "advance" &&
      squad.actorIds.length < 4))) failures.push("strategy_unsupported_offense_resumed_before_essential_recovery");
  return failures;
}
