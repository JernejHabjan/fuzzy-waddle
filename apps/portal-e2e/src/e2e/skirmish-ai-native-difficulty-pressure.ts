import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeDifficultyProfile } from "./skirmish-ai-native-difficulty-profile";
import { nativeDifficultySelectionFailures } from "./skirmish-ai-native-difficulty-evaluation";
import { nativeWeaponHits } from "./skirmish-ai-native-combat-effects";

/** Actual scheduler rejection establishes cap pressure; domain partitions are members of one voluntary mission. */
export function evaluateNativeDifficultyPressure(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const failures = nativeDifficultySelectionFailures(branch, context.frames, 4000), expected = nativeDifficultyProfile(branch);
  const active = (frame: typeof context.frames[number]) => new Set(frame.decision.missionState?.squads.filter((squad) =>
    squad.role === "attack" && !["completed", "cancelled"].includes(squad.state))
    .map((squad) => squad.squadId.split(":domain:")[0]) ?? []);
  if (context.frames.some((frame) => active(frame).size > expected.voluntaryOffensiveMissionLimit))
    failures.push("difficulty_voluntary_offensive_cap_exceeded");
  const saturated = context.frames.filter((frame) =>
    frame.decision.acceptedIntents.length === expected.maxAcceptedCommandBatchesPerStep &&
    frame.decision.decisions.some((decision) => decision.outcome === "rejected" && decision.reason === "profile_limit" &&
      decision.detail === "step_budget" && !decision.intent.planId.includes("defense")));
  if (!saturated.length) failures.push("difficulty_actual_selected_command_cap_pressure_missing");
  const attackers = Object.entries(context.roles).filter(([role]) => role.startsWith("pressure-attacker-")).map(([, id]) => id);
  const threatened = context.facts.find((fact) => fact.kind === "native_damage" && fact.tick >= 600 &&
    !!fact.damage.initiator?.actorId && attackers.includes(fact.damage.initiator.actorId) &&
    fact.damage.target.playerNumber === 2 && fact.damage.amount > 0);
  const hits = nativeWeaponHits(context);
  if (!threatened || !saturated.some((frame) => frame.tick >= threatened.tick && frame.tick <= threatened.tick + 400 &&
    frame.decision.missionState?.squads.some((squad) => squad.role === "defense" && squad.actorIds.length) &&
    hits.some((fact) => fact.kind === "native_damage" && !!fact.damage.target.actorId &&
      attackers.includes(fact.damage.target.actorId) && fact.tick >= frame.tick && fact.tick <= frame.tick + 200)))
    failures.push("difficulty_emergency_defense_not_served_under_saturated_voluntary_cap");
  let prior: typeof context.frames[number] | undefined, changes = 0;
  for (const frame of context.frames) {
    const adaptation = frame.decision.economyProduction.adaptation, previous = prior?.decision.economyProduction.adaptation;
    if (previous && adaptation.lastTransitionTick !== previous.lastTransitionTick && adaptation.lastTransitionTick !== null) {
      changes++;
      if (previous.lastTransitionTick !== null &&
        adaptation.lastTransitionTick - previous.lastTransitionTick < expected.compositionReconsiderationTicks)
        failures.push("difficulty_composition_changed_before_reconsideration_boundary");
    }
    if (previous?.lastTransitionTick !== null && previous?.lastTransitionTick !== undefined &&
      frame.tick - previous.lastTransitionTick < expected.compositionReconsiderationTicks &&
      JSON.stringify(adaptation.activeRoleTargets) !== JSON.stringify(previous.activeRoleTargets))
      failures.push("difficulty_composition_target_changed_while_ineligible");
    prior = frame;
  }
  if (changes < 2 || !context.frames.some((frame) => frame.decision.economyProduction.adaptation.evidence.some((evidence) =>
    evidence.sourceContactId === context.roles["pressure-air"] && evidence.kind === "flyer")))
    failures.push("difficulty_real_counter_evidence_and_reconsideration_cycles_missing");
  return [...new Set(failures)];
}
