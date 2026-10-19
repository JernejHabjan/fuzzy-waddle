import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeWeaponHits, nativeRetainedActor } from "./skirmish-ai-native-combat-effects";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";
import { nativeScoutTrips } from "./skirmish-ai-native-scouting-evaluation";
import { hasNativeSourceDelivery } from "./skirmish-ai-source-delivery";
import { ResourceType, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

/** Classic decisions are judged by original commitments and native effects, never a phase label alone. */
export function evaluateNativeClassic(id: string, branch: string, context: ReturnType<typeof nativeScenarioContext>): string[] {
  if (id === "C-01") return transitionFailures(branch, context);
  if (id === "C-02") return windowFailures(branch, context);
  if (id === "C-03") return armyDemandFailures(branch, context);
  if (id === "C-04") return informationFailures(branch, context);
  if (id === "C-05") return pursuitFailures(branch, context);
  if (id === "C-06") return opponentFailures(branch, context);
  return ["classic_native_reader_missing"];
}

/** Native paid work must either complete once or be cancelled through an attributed normal AI command/refund. */
function transitionFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], initial = context.result.presetInitialQueueItems;
  if (initial.length !== 4) failures.push("classic_transition_original_paid_queue_missing");
  const frames = context.frames.filter((frame) => frame.tick >= 400);
  if (!frames.some((frame) => frame.decision.economyProduction.adaptation.lastTransitionTick !== null &&
      frame.decision.economyProduction.adaptation.evidence.some((evidence) => evidence.sourceContactId === context.roles["new-contact"])))
    failures.push("classic_transition_has_no_fair_causal_evidence");
  for (const item of initial) {
    const complete = nativePaidMissionOutputs(context).filter((output) => output.item.itemId === item.itemId);
    const refund = context.facts.filter((fact) => fact.kind === "queue_resource" && fact.resource.itemId === item.itemId &&
      fact.resource.operation === "cancellation_refund" && fact.resource.cancellationCommand?.execution?.source === "ai" &&
      fact.resource.emission.phase === "finished" && fact.resource.emission.status === "returned" &&
      fact.resource.emission.balanceMatches && fact.resource.emission.callbackCount === 1);
    if (complete.length + refund.length !== 1 || branch === "retain" && refund.length)
      failures.push("classic_original_paid_commitment_lost_duplicated_or_unlawfully_cancelled");
  }
  for (const role of ["ready-producer", "ready-house", "own-deposit"])
    if (!nativeRetainedActor(context, context.roles[role])) failures.push(`classic_useful_completed_asset_lost:${role}`);
  const plans = context.frames.map((frame) => frame.decision.opening?.planId);
  if (new Set(plans).size > 1) failures.push("classic_transition_restarted_opening");
  if (branch === "obsolete" && !context.facts.some((fact) => fact.kind === "queue_resource" &&
      initial.some((item) => item.itemId === fact.resource.itemId) && fact.tick >= 400 &&
      fact.resource.operation === "cancellation_refund" && fact.resource.cancellationCommand?.execution?.source === "ai"))
    failures.push("classic_obsolete_optional_work_never_lawfully_cancelled");
  if (!nativeWeaponHits(context).length) failures.push("classic_transition_has_no_useful_native_force_effect");
  return [...new Set(failures)];
}

/** The authored opportunity closes independently of planner estimates and cannot slide while the roster improves. */
function windowFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], close = branch === "window_closed" ? 800 : 1200;
  const research = context.facts.find((fact) => fact.kind === "research_completed" &&
    fact.researchType === (context.result.aiFaction === "Tivara" ? "tivaraMacemanUpgradeLevel2" : "skaduweeWarriorUpgradeLevel2"));
  const hits = nativeWeaponHits(context, context.roles["contact-group"]);
  if (branch === "upgrade_ready" && (!research || research.tick >= close || !hits.some((hit) =>
      hit.tick >= research.tick && hit.tick < close))) failures.push("classic_paid_upgrade_window_not_used");
  if (branch === "optional_delayed" && (!hits.some((hit) => hit.tick < close) ||
      !nativePaidMissionOutputs(context).some((output) => output.fact.tick > (hits[0]?.tick ?? Infinity))))
    failures.push("classic_optional_roster_delay_prevented_timely_native_attack");
  if (branch === "window_closed") {
    const seen = context.frames.find((frame) => frame.tick >= close && frame.decision.input?.observation?.actors.filter((actor) =>
      actor.visibility === "visible" && Object.entries(context.roles).some(([role, id]) =>
        role.startsWith("window-counter-") && id === actor.actorId)).length === 12);
    if (!seen || !research || research.tick <= close) failures.push("classic_window_did_not_close_before_real_research");
    if (!context.frames.some((frame) => frame.tick > (seen?.tick ?? Infinity) && frame.tick <= (seen?.tick ?? 0) + 400 &&
        frame.decision.missionState?.squads.some((squad) => ["retreat", "regroup", "recover"].includes(squad.state))) ||
        !context.arrived(context.roles["ranged-probe"], close).length)
      failures.push("classic_closed_window_has_no_bounded_feasible_replan_effect");
  }
  return failures;
}

/** Repeated output must serve a dated deficit; fully satisfied demand needs a complete quiet spending window. */
function armyDemandFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], name = context.result.aiFaction === "Tivara" ?
    ObjectNames.TivaraMacemanMale : ObjectNames.SkaduweeWarriorMale;
  const outputs = nativePaidMissionOutputs(context).filter((output) => output.actor.canonicalObjectName === name);
  if (["deficit", "paid_queue"].includes(branch) && (outputs.length < 4 || !outputs.some((output) =>
      nativeWeaponHits(context).some((hit) => hit.kind === "native_damage" && hit.damage.initiator?.actorId === output.actor.actorId))))
    failures.push("classic_affordable_repeated_output_has_no_useful_growth");
  const fulfilled = context.frames.find((frame) => frame.tick >= 800 && frame.tick <= 3600 &&
    frame.decision.economyProduction.demands.some((demand) => demand.preferredObjectNames.includes(name)) &&
    frame.decision.economyProduction.demands.filter((demand) => demand.preferredObjectNames.includes(name)).every((demand) =>
      new Set(demand.satisfiedActorIds).size + demand.queuedIds.length + demand.constructingIds.length +
      demand.acceptedNotObservedEffectIds.length >= demand.desired));
  if (["fulfilled", "need_removed"].includes(branch)) {
    if (!fulfilled || !context.frames.some((frame) => frame.tick >= fulfilled.tick + 400))
      failures.push("classic_fulfilled_demand_has_no_complete_settled_window");
    else if (context.frames.some((frame) => frame.tick > fulfilled.tick && frame.tick <= fulfilled.tick + 400 &&
      frame.decision.acceptedIntents.some((intent) => intent.kind === "produce" && intent.objectName === name)))
      failures.push("classic_fulfilled_demand_keeps_buying_extra_copies");
  }
  if (branch === "need_removed" && !context.result.perturbations.some((event) => event.id === "loss-original-mission" &&
      event.affectedActorId === context.roles["contact-group"])) failures.push("classic_demand_removal_not_natively_applied");
  if (branch === "paid_queue" && context.result.presetInitialQueueItems.some((item) =>
      outputs.filter((output) => output.item.itemId === item.itemId).length !== 1))
    failures.push("classic_paid_queue_was_not_counted_once");
  if (!hasNativeSourceDelivery(context.capture?.facts ?? [], { sourceActorId: context.roles["own-source"], sourceOwner: null,
    playerNumber: 2, resourceType: ResourceType.Wood, fromTick: 0, throughTick: 4000, depositActorId: context.roles["own-deposit"] }))
    failures.push("classic_army_growth_starved_essential_native_income");
  return failures;
}

/** One source identity cannot become several enemies; same dated evidence must remain stable under repeated reads. */
function informationFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], target = context.roles["contact-group"];
  const seen = new Map<string, { tick: number; confidence: number }>();
  for (const frame of context.frames) {
    const evidence = frame.decision.economyProduction.adaptation.evidence;
    const keys = evidence.map((entry) => `${entry.sourceContactId}:${entry.kind}`);
    if (new Set(keys).size !== keys.length) failures.push("classic_repeated_contact_multiplied_evidence_mass");
    for (const entry of evidence) {
      const key = `${entry.sourceContactId}:${entry.kind}`, prior = seen.get(key);
      if (entry.confidencePermille < 0 || entry.confidencePermille > 1000 || prior && entry.observedTick === prior.tick &&
          entry.confidencePermille !== prior.confidence) failures.push("classic_unchanged_dated_evidence_inflated_confidence");
      seen.set(key, { tick: entry.observedTick, confidence: entry.confidencePermille });
    }
  }
  if (["answered", "distinct"].includes(branch) && (!nativeScoutTrips(context).length ||
      !context.frames.some((frame) => frame.decision.missionState?.knowledge.questions.some((question) => question.state === "answered")) ||
      !nativeWeaponHits(context, target).length)) failures.push("classic_relevant_scout_answer_has_no_changed_native_decision");
  if (branch === "repeated" && context.frames.filter((frame) => frame.decision.input?.observation?.actors.some((actor) =>
      actor.actorId === target && actor.visibility === "visible")).length < 8) failures.push("classic_repeated_contact_premise_missing");
  if (branch === "distinct" && !context.frames.some((frame) => frame.tick >= 1200 &&
      [target, context.roles["distinct-contact"]].every((id) => frame.decision.input?.observation?.actors.some((actor) =>
        actor.actorId === id && actor.visibility === "visible")))) failures.push("classic_second_distinct_native_contact_missing");
  if (branch === "irrelevant" && !nativeWeaponHits(context).length) failures.push("classic_irrelevant_control_stopped_useful_work");
  return [...new Set(failures)];
}

/** A real bait retreat must not drag essential defenders under observed towers; victories need useful follow-up. */
function pursuitFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], target = context.roles["contact-group"];
  const home = context.roles["own-deposit"];
  if (!nativeRetainedActor(context, home)) failures.push("classic_protected_service_asset_lost");
  const sawDanger = context.frames.some((frame) => frame.tick >= 600 && frame.decision.input?.observation?.actors.some((actor) =>
    actor.visibility === "visible" && Object.entries(context.roles).some(([role, id]) =>
      role.startsWith("pursuit-danger-") && id === actor.actorId)));
  if (["bait", "valuable"].includes(branch) && !sawDanger) failures.push("classic_retreating_target_danger_never_legitimately_seen");
  if (branch === "bait" && context.frames.some((frame) => frame.tick >= 600 && frame.decision.missionState?.squads.some((squad) =>
    squad.role === "defense" && squad.tactics?.targetActorId === target && squad.actorIds.some((id) =>
      frame.tacticalBoundary?.actors.some((actor) => actor.identity.actorId === id && actor.tile && actor.tile.x < 24)))))
    failures.push("classic_bait_pulled_asset_defenders_beyond_safe_leash");
  if (["won_battle", "unsafe"].includes(branch) && !nativeWeaponHits(context, target).some((hit) =>
      hit.kind === "native_damage" && hit.damage.healthAfter === 0)) failures.push("classic_native_battle_win_missing");
  if (["valuable", "won_battle"].includes(branch) && !nativeWeaponHits(context, context.roles["front-target-a"], 600).length)
    failures.push("classic_safe_post_battle_objective_has_no_native_pressure");
  if (branch === "unsafe" && context.frames.some((frame) => frame.tick > 600 && frame.decision.missionState?.squads.some((squad) =>
      squad.role === "defense" && squad.actorIds.length && squad.state === "advance")))
    failures.push("classic_unsafe_followup_abandoned_essential_defense");
  return failures;
}

/** Three ordinary players and real defeat/team state govern coherent focus; no fixture-forced diplomacy or defeat. */
function opponentFailures(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], first = context.frames[0]?.tacticalBoundary?.players;
  if (!first || first.length !== 3 || context.result.otherOpponentCaptures?.filter((capture) => capture.playerNumber === 3).length !== 1)
    return ["classic_real_three_player_roster_or_native_history_missing"];
  const ally = first.find((player) => player.playerNumber === 1)?.team === first.find((player) => player.playerNumber === 2)?.team;
  if (ally !== (branch === "allied_control")) failures.push("classic_initial_team_control_missing");
  for (const frame of context.frames) for (const intent of frame.decision.acceptedIntents) {
    if (intent.kind !== "attack") continue;
    const owner = frame.tacticalBoundary?.actors.find((actor) => actor.identity.actorId === intent.targetActorId)?.identity.playerNumber;
    const target = frame.tacticalBoundary?.players?.find((player) => player.playerNumber === owner);
    const self = frame.tacticalBoundary?.players?.find((player) => player.playerNumber === 2);
    if (target?.defeated || target && target.team === self?.team) failures.push("classic_attack_selected_against_allied_or_defeated_owner");
  }
  if (branch !== "allied_control") {
    const defeated = context.frames.find((frame) => frame.tacticalBoundary?.players?.some((player) =>
      player.playerNumber === 1 && player.defeated));
    if (!defeated || !nativeWeaponHits(context, context.roles["enemy-home"]).length ||
        !nativeWeaponHits(context, context.roles["third-home"], defeated?.tick ?? Infinity).length)
      failures.push("classic_real_focus_defeat_has_no_useful_other_opponent_retarget");
  } else if (!nativeWeaponHits(context, context.roles["third-home"]).length)
    failures.push("classic_allied_control_has_no_useful_remaining_enemy_focus");
  if (branch === "local_threat" && (!context.facts.some((fact) => fact.kind === "native_damage" &&
      fact.damage.target.actorId === context.roles["own-deposit"] && fact.damage.initiator?.playerNumber === 3) ||
      !nativeWeaponHits(context, context.roles["third-raider"], 400).length))
    failures.push("classic_distinct_local_threat_not_physically_serviced");
  return [...new Set(failures)];
}
