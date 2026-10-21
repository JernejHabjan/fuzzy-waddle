import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeDifficultyProfile } from "./skirmish-ai-native-difficulty-profile";
import { nativeDifficultySelectionFailures } from "./skirmish-ai-native-difficulty-evaluation";
import { normalizeRuntimeProductionSetup } from "./skirmish-ai-runtime-production-setup";

/** Independently prove each changed native premise; labels and scheduled inputs alone cannot satisfy fairness. */
export function evaluateNativeDifficultyFairness(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const [policy, mutation] = branch.split("_"), expected = nativeDifficultyProfile(policy);
  const failures = nativeDifficultySelectionFailures(policy, context.frames);
  if (context.capture?.setup?.players.find((player) => player.playerNumber === 2)
    ?.controller.playerDefinition?.difficulty !== expected.sourceDifficulty)
    failures.push("fairness_lobby_profile_mismatch");
  const id = context.roles["hidden-probe"];
  const before = context.frames.find((frame) => frame.tick < 600)?.tacticalBoundary?.actors.find((actor) =>
    actor.identity.actorId === id);
  const after = context.frames.filter((frame) => frame.tick > 600).flatMap((frame) =>
    frame.tacticalBoundary?.actors.filter((actor) => actor.identity.actorId === id) ?? []);
  if (!before || before.visible || !after.length) failures.push("fairness_hidden_original_missing");
  if (mutation === "position" && !after.some((actor) => !actor.visible &&
    JSON.stringify(actor.tile) !== JSON.stringify(before?.tile))) failures.push("fairness_hidden_position_never_changed");
  if (mutation === "health" && (!after.some((actor) => !actor.visible &&
      (actor.health !== before?.health || actor.armour !== before?.armour)) ||
      !context.facts.some((fact) => fact.kind === "native_damage" && fact.tick === 600 &&
        fact.damage.target.actorId === id && fact.damage.initiator === null && fact.damage.amount === 5)))
    failures.push("fairness_hidden_health_never_changed");
  if (mutation === "queue" && !context.opponent?.facts.some((fact) => fact.kind === "queue_mutation" &&
    fact.tick >= 600 && fact.mutation.actorId === context.roles["enemy-producer"]))
    failures.push("fairness_hidden_queue_never_changed");
  if (mutation === "contact" && !context.frames.some((frame) => frame.tick > 600 &&
    frame.tacticalBoundary?.actors.some((actor) => actor.identity.actorId === id && actor.visible) &&
    frame.decision.input?.observation?.actors.some((actor) => actor.actorId === id && actor.visibility === "visible")))
    failures.push("fairness_legitimate_new_contact_missing");
  return failures;
}

/** Same-policy hidden changes require exact input/intent equality after the change, until genuine information differs. */
export function evaluateDifficultyFairnessPairs(
  worlds: readonly RuntimeVariantResultV1[], branchOf: (world: RuntimeVariantResultV1) => string | undefined
) {
  const failures: string[] = [];
  const setupSignatures: string[] = [];
  for (const policy of ["easy", "normal", "hard"]) {
    const original = worlds.find((world) => branchOf(world) === `${policy}_baseline`);
    if (!original?.productionCapture?.setup) { failures.push("fairness_baseline_missing"); continue; }
    const normalized = normalizeRuntimeProductionSetup(original.productionCapture.setup, original.presetCreatedActorIds);
    if (normalized.failures.length) failures.push("fairness_actual_setup_unavailable");
    // Only the selected lobby policy differs across difficulty. Native definitions, resources, tech and actors stay compared.
    const canonical = structuredClone(normalized.canonical);
    for (const player of canonical.players) {
      if (player && typeof player === "object" && "controller" in player && player.controller &&
        typeof player.controller === "object" && "playerDefinition" in player.controller &&
        player.controller.playerDefinition && typeof player.controller.playerDefinition === "object")
        Reflect.deleteProperty(player.controller.playerDefinition, "difficulty");
    }
    setupSignatures.push(JSON.stringify(canonical));
    const left = nativeScenarioContext(original, 2000);
    for (const mutation of ["position", "health", "queue", "contact"]) {
      const changed = worlds.find((world) => branchOf(world) === `${policy}_${mutation}`);
      if (!changed?.productionCapture?.setup) { failures.push("fairness_changed_world_missing"); continue; }
      const otherSetup = normalizeRuntimeProductionSetup(changed.productionCapture.setup, changed.presetCreatedActorIds);
      if (!normalized.digest || normalized.digest !== otherSetup.digest) failures.push("fairness_pair_initial_setup_changed");
      const right = nativeScenarioContext(changed, 2000);
      if (left.failures.length || right.failures.length) { failures.push("fairness_pair_history_incomplete"); continue; }
      let postChangeCompared = 0, observedContact = false;
      for (const frame of left.frames) {
        const other = right.frames.find((candidate) => candidate.tick === frame.tick);
        if (!other) { failures.push("fairness_selected_boundary_missing"); break; }
        const visible = (value: typeof frame) => value.decision.input?.observation?.actors.filter((actor) =>
          actor.relation === "enemy" && actor.visibility === "visible");
        if (JSON.stringify(visible(frame)) !== JSON.stringify(visible(other))) { observedContact = true; break; }
        if (JSON.stringify(frame.decision.input) !== JSON.stringify(other.decision.input) ||
          JSON.stringify(frame.decision.acceptedIntents) !== JSON.stringify(other.decision.acceptedIntents))
          failures.push("fairness_hidden_state_changed_permitted_input_or_decision");
        if (frame.tick > 600) postChangeCompared++;
      }
      if (mutation === "contact" ? !observedContact : postChangeCompared < 2)
        failures.push("fairness_pair_control_window_missing");
    }
  }
  if (setupSignatures.length !== 3 || new Set(setupSignatures).size !== 1)
    failures.push("fairness_difficulty_changed_native_rules_resources_or_stats");
  return [...new Set(failures)];
}
