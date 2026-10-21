import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import type { RuntimePresetWorldV1 } from "./skirmish-ai-runtime-preset-world";
import { nativeCompletedPlacements } from "./skirmish-ai-native-construction-evidence";
import { nativeProtectedTransits } from "./skirmish-ai-native-placement-evaluation";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";
import { nativeRetreats, nativeWeaponHits } from "./skirmish-ai-native-combat-effects";
import { nativeFortificationBudgetFailures } from "./skirmish-ai-native-fortification-budget";

/** Defense must repair a real breach, preserve friendly passage, withdraw physically and create outside pressure. */
export function evaluateNativeFortificationSequence(
  branch: string, context: ReturnType<typeof nativeScenarioContext>, preset: RuntimePresetWorldV1
) {
  const failures = nativeProtectedTransits(context, preset);
  failures.push(...nativeFortificationBudgetFailures(context, true));
  const role = branch === "stair" ? "perimeter-stair" : "perimeter-wall";
  if (!context.result.perturbations.some((event) => event.id === "sequence-breach" && event.tick === 800 &&
    event.affectedActorId === context.roles[role])) failures.push("sequence_original_native_breach_missing");
  const repair = nativeCompletedPlacements(context).filter((placement) => placement.fact.tick >= 800 &&
    ["Wall", "Stairs", "WatchTower"].includes(placement.value.site.canonicalObjectName));
  if (!repair.some((placement) => placement.completionTick <= 4000))
    failures.push("sequence_breach_has_no_bounded_paid_native_defense_recovery");
  const hits = nativeWeaponHits(context);
  if (!hits.some((fact) => fact.kind === "native_damage" && fact.damage.target.actorId === context.roles["contact-group"]))
    failures.push("sequence_fortification_has_no_native_ground_defense_value");
  if (!hits.some((fact) => fact.tick >= 4000 && fact.kind === "native_damage" &&
    fact.damage.target.actorId === context.roles["sequence-air"])) failures.push("sequence_air_threat_has_no_compatible_native_response");
  if (!nativeRetreats(context, 800).length) failures.push("sequence_defender_physical_withdrawal_missing");
  if (!hits.some((fact) => fact.tick >= 6000 && fact.kind === "native_damage" && context.frames.some((frame) =>
    frame.tick <= fact.tick && fact.tick - frame.tick <= 40 && frame.tacticalBoundary?.actors.some((actor) =>
      actor.identity.actorId === fact.damage.initiator?.actorId && actor.tile && actor.tile.x < 28))))
    failures.push("sequence_mobile_force_never_created_native_outside_pressure");
  if (context.frames.some((frame) => frame.decision.input?.resources?.some((resource) => resource.stockpile < 0)))
    failures.push("sequence_repair_spending_overdrew_actual_bank");
  if (branch === "value_lost") {
    if (!context.result.perturbations.some((event) => event.id === "sequence-asset-loss" &&
      event.affectedActorId === context.roles["protected-deposit"])) failures.push("sequence_protected_asset_loss_missing");
    if (context.frames.some((frame) => frame.tick > 1600 && frame.decision.acceptedIntents.some((intent) =>
      intent.kind === "construct" && ["Wall", "Stairs", "WatchTower"].includes(intent.objectName) &&
      intent.logicalPosition.x >= 30 && intent.logicalPosition.x <= 34 && intent.logicalPosition.y <= 22)))
      failures.push("sequence_obsolete_remote_protection_still_funded");
  }
  return [...new Set(failures)];
}

/** Fresh versus aging evidence, retained original queues, a real failed assault and a subsequent useful revised mission. */
export function evaluateNativeAdaptationSequence(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], counter = context.roles["sequence-counter"];
  const evidence = context.frames.flatMap((frame) => frame.decision.economyProduction.adaptation.evidence
    .filter((entry) => entry.sourceContactId === counter).map((entry) => ({ frame, entry })));
  const confirmed = evidence.find(({ entry }) => entry.consecutiveEvaluations >= 2);
  if (branch !== "stale" && !confirmed) failures.push("sequence_native_confirmed_counter_evidence_missing");
  const stale = evidence.find(({ frame, entry }) => frame.tick - entry.observedTick >= 720);
  if (!stale || !evidence.some(({ frame, entry }) => frame.tick < stale.frame.tick &&
    entry.confidencePermille > stale.entry.confidencePermille)) failures.push("sequence_old_sightings_never_lost_certainty");
  const before = context.frames.filter((frame) => frame.tick < 1800).at(-1);
  const attackers = before?.decision.missionState?.squads.filter((squad) => squad.role === "attack")
    .flatMap((squad) => squad.actorIds) ?? [];
  if (!attackers.length || !nativeWeaponHits(context).some((fact) => fact.tick < 1800) ||
    !context.facts.some((fact) => fact.kind === "native_damage" && fact.tick < 1800 &&
      fact.damage.initiator?.playerNumber === 1 && !!fact.damage.target.actorId && attackers.includes(fact.damage.target.actorId)))
    failures.push("sequence_physical_failed_assault_premise_missing");
  for (let i = 0; i < 3; i++) if (!context.result.perturbations.some((event) => event.id === `sequence-assault-loss-${i}` &&
    event.tick === 1800 && event.affectedActorId === context.roles[`army-${i}`]))
    failures.push("sequence_original_assault_losses_missing");
  const originalItems = context.result.presetInitialQueueItems, paid = nativePaidMissionOutputs(context);
  if (originalItems.length !== 4 || originalItems.some((item) => paid.filter((output) => output.item.itemId === item.itemId).length !== 1))
    failures.push("sequence_useful_original_paid_queue_churned_or_lost");
  const first = context.frames[0]?.decision.opening;
  if (!first || context.frames.some((frame) => frame.decision.opening?.archetypeId !== first.archetypeId ||
    frame.decision.opening.selectedAtTick !== first.selectedAtTick)) failures.push("sequence_failed_attack_reset_opening");
  const revised = context.frames.find((frame) => frame.tick > 1800 && frame.tick <= 4000 &&
    (frame.decision.strategy?.objectiveId !== before?.decision.strategy?.objectiveId ||
      JSON.stringify(frame.decision.economyProduction.adaptation.activeRoleTargets) !==
        JSON.stringify(before?.decision.economyProduction.adaptation.activeRoleTargets)));
  if (!revised || !nativeWeaponHits(context, undefined, 4000).length || !paid.some((output) =>
    nativeWeaponHits(context, undefined, 4000).some((fact) => fact.kind === "native_damage" &&
      fact.damage.initiator?.actorId === output.actor.actorId)))
    failures.push("sequence_failed_assault_has_no_revised_plan_and_new_native_pressure");
  if (branch === "alternate" && !context.result.perturbations.some((event) => event.id === "sequence-opportunity-opens" &&
    event.affectedActorId === context.roles["sequence-opportunity-wall"])) failures.push("sequence_new_alternate_objective_never_opened");
  return [...new Set(failures)];
}
