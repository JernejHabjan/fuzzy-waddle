import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeDifficultyProfile } from "./skirmish-ai-native-difficulty-profile";
import { nativeCompletedPlacements } from "./skirmish-ai-native-construction-evidence";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";
import { nativeRetreats, nativeWeaponHits } from "./skirmish-ai-native-combat-effects";
import { hasNativeSourceDelivery } from "./skirmish-ai-source-delivery";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Continuous Easy opening, earned repeated units, compatible counter, physical retreat and useful recovery. */
export function evaluateNativeEasyContinuity(context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [], expected = nativeDifficultyProfile("easy");
  const bank = context.capture?.setup?.players.find((player) => player.playerNumber === 2)?.state.resources;
  if (!bank || Object.values(ResourceType).some((type) => bank[type] !== 200) ||
    context.result.presetResourceGrantCount || context.result.presetResourceStartCount || context.result.initialWorkerCount !== 0)
    failures.push("easy_ordinary_unassisted_faction_start_missing");
  if (context.frames.length !== 450 || context.frames.some((frame, index) => frame.tick !== (index + 1) * 40 ||
    !frame.decision.input?.profile || Object.entries(expected).some(([key, value]) =>
      Reflect.get(frame.decision.input?.profile ?? {}, key) !== value) ||
    frame.decision.persistedProfile?.profileDifficulty !== "easy" || frame.decision.acceptedIntents.length > 4))
    failures.push("easy_complete_selected_policy_history_missing");
  const placements = nativeCompletedPlacements(context, false), outputs = nativePaidMissionOutputs(context);
  if (!placements.some((placement) => placement.completionTick < 2600) || !nativeEasyIncome(context, 0) ||
    !outputs.some((output) => outputs.filter((other) => other.objectName === output.objectName &&
      other.fact.tick < 2600).length >= 2)) failures.push("easy_earned_opening_and_useful_repeated_output_missing");
  const hits = nativeWeaponHits(context);
  const counterIds = new Set(Object.entries(context.roles).filter(([role]) => role.startsWith("continuity-counter-"))
    .map(([, id]) => id));
  if (!hits.some((fact) => fact.kind === "native_damage" && fact.tick >= 2600 &&
    !!fact.damage.target.actorId && counterIds.has(fact.damage.target.actorId) && outputs.some((output) =>
      output.actor.actorId === fact.damage.initiator?.actorId)))
    failures.push("easy_earned_compatible_counter_has_no_native_effect");
  if (!context.facts.some((fact) => fact.kind === "native_damage" && fact.tick >= 3000 &&
    fact.damage.initiator?.actorId && counterIds.has(fact.damage.initiator.actorId) &&
    fact.damage.target.playerNumber === 2 && fact.damage.amount > 0) || !nativeRetreats(context, 2600).length)
    failures.push("easy_unfavorable_native_fight_and_surviving_retreat_missing");
  if (!context.result.perturbations.some((event) => event.id === "continuity-worker-loss" &&
    event.tick === 3200 && outputs.some((output) => output.actor.actorId === event.affectedActorId &&
      output.objectName === `${context.result.aiFaction}WorkerMale` && output.fact.tick < 3200)) ||
    !nativeEasyIncome(context, 5000) || !outputs.some((output) => output.fact.tick > 5000) ||
    !hits.some((fact) => fact.tick > 5000))
    failures.push("easy_post_loss_delivered_economy_production_and_mission_recovery_missing");
  if (context.frames.some((frame) => frame.decision.acceptedIntents.some((intent) => intent.kind === "concede")))
    failures.push("easy_viable_world_conceded");
  return failures;
}

function nativeEasyIncome(context: ReturnType<typeof nativeScenarioContext>, after: number) {
  const sources = context.capture?.setup?.actors.filter((actor) => actor.definition.resourceSource).map((actor) => actor.actorId) ?? [];
  return sources.some((sourceActorId) => hasNativeSourceDelivery(context.capture?.facts ?? [], {
    sourceActorId, sourceOwner: null, playerNumber: 2, resourceType: ResourceType.Wood, fromTick: after, throughTick: 18000
  }));
}
