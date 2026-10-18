import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { nativeDamageMatches } from "./skirmish-ai-native-damage";
import { runtimeControlTransitFailures } from "./skirmish-ai-runtime-control-transit";
import { normalizeRuntimeMovement } from "./skirmish-ai-runtime-movement-normalization";

/** Every original attacker must actually leave or die. Combat recovery requires exact AI-owned lethal native damage. */
export function expansionPressureResolution(
  human: AiRuntimeProductionCaptureV1, raiderIds: readonly string[], combatOnly: boolean
): { resolvedTick: number | undefined; resolvedSequence: number | undefined; failures: string[] } {
  const failures: string[] = [], resolved: { tick: number; sequence: number }[] = [];
  let observedRetreat = false;
  if (!raiderIds.length || new Set(raiderIds).size !== raiderIds.length) return {
    resolvedTick: undefined, resolvedSequence: undefined, failures: ["expansion_original_attackers_missing_or_reused"]
  };
  for (const [index, raiderId] of raiderIds.entries()) {
    const loss = human.facts.find((fact) => fact.kind === "actor_unregistered" && fact.tick <= 3000 &&
      fact.actorId === raiderId && fact.actor?.playerNumber === 1 && fact.actor.alive === false
    );
    const nativeKill = loss && human.facts.find((fact) => nativeDamageMatches(fact, raiderId, 2) &&
      fact.tick === loss.tick && fact.damage.healthAfter === 0 && !fact.damage.target.alive
    );
    if (combatOnly) {
      if (!loss || !nativeKill) failures.push(`expansion_original_attacker_not_killed_by_native_ai_combat:${raiderId}`);
      else resolved.push({ tick: loss.tick, sequence: nativeKill.sequence });
      continue;
    }
    const controlId = index ? `withdraw-home-pressure-${index}` : "withdraw-home-pressure";
    const withdrawal = human.facts.find((fact) => fact.kind === "preset_control" &&
      fact.control.id === controlId && fact.control.phase !== "requested"
    );
    if (withdrawal?.kind !== "preset_control" || withdrawal.control.actorId !== raiderId) {
      failures.push(`expansion_pressure_removal_control_missing:${raiderId}`);
      continue;
    }
    if (withdrawal.control.phase === "unavailable") {
      if (!loss || !nativeKill || loss.tick > 200) failures.push(`expansion_unavailable_removal_without_native_loss:${raiderId}`);
      else resolved.push({ tick: loss.tick, sequence: nativeKill.sequence });
    } else if (loss && nativeKill) resolved.push({ tick: loss.tick, sequence: nativeKill.sequence });
    else {
      const transit = runtimeControlTransitFailures(human, controlId, 3000, "arrive");
      failures.push(...transit);
      if (transit.length) continue;
      const commandId = withdrawal.control.command?.execution?.commandId;
      const arrival = normalizeRuntimeMovement(human).movements.find((movement) =>
        movement.callerAttributed && !movement.gaps.length && movement.arrival === "original_destination" &&
        movement.returned === "true" && movement.started.spatial.caller?.order?.commandContext?.execution.commandId === commandId
      );
      const event = arrival?.observations.find((entry) => entry.spatial.phase === "arrived");
      if (event) {
        observedRetreat = true;
        resolved.push({ tick: event.tick, sequence: event.sequence });
      }
    }
  }
  if (!combatOnly && !observedRetreat) failures.push("expansion_withdrawal_branch_has_no_native_survivor_retreat");
  const last = resolved.length === raiderIds.length && !failures.length
    ? resolved.sort((left, right) => left.tick - right.tick || left.sequence - right.sequence).at(-1) : undefined;
  return { resolvedTick: last?.tick, resolvedSequence: last?.sequence, failures };
}
