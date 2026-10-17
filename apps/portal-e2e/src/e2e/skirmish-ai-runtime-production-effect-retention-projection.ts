import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionWorldSnapshotV1 } from "./skirmish-ai-runtime-production-world-snapshot";
import type { RuntimeProductionEffectRetentionV1 } from "./skirmish-ai-runtime-production-effect-retention";

/** Connects exact native completions to subsequent owned actor/tech samples. It never interpolates the unsampled interval. */
export function projectRuntimeProductionEffectRetention(
  capture: AiRuntimeProductionCaptureV1,
  commands: RuntimeProductionCausalityV1["commands"],
  completions: RuntimeProductionCausalityV1["completions"],
  snapshots: readonly RuntimeProductionWorldSnapshotV1[]
) {
  const effects: RuntimeProductionEffectRetentionV1[] = [];
  const failures: string[] = [];
  const gaps = new Set<string>();
  // Bound report expansion as well as raw input; omitted samples cannot contribute oracle evidence.
  if (completions.length > 256 || completions.length * snapshots.length > 8192) {
    return { effects, failures, gaps: ["production_effect_retention_overflow"] };
  }
  const actorEvents = new Map<string, typeof capture.facts[number][]>();
  for (const fact of capture.facts) {
    const id = fact.kind === "actor_registered" ? fact.actor.actorId : fact.kind === "actor_unregistered" ? fact.actorId : null;
    if (!id) continue;
    const events = actorEvents.get(id) ?? [];
    events.push(fact); actorEvents.set(id, events);
  }
  for (const completion of completions) {
    const origin = commands.find((entry) => entry.command.execution?.commandId === completion.originatingCommandId);
    const samples: RuntimeProductionEffectRetentionV1["samples"][number][] = [];
    if (!origin?.decision) gaps.add("production_effect_accepted_decision_missing");
    for (const snapshot of snapshots) {
      if (snapshot.tick < completion.terminalTick) continue;
      const afterSequence = snapshot.afterSequence;
      if (afterSequence === null) { gaps.add("production_effect_snapshot_order_missing"); continue; }
      if (afterSequence < completion.terminalSequence) continue;
      let state: RuntimeProductionEffectRetentionV1["samples"][number]["state"] = "unavailable";
      let currentLevel: number | null = null;
      if (completion.createdActor) {
        const identity = completion.createdActor;
        const actor = snapshot.actors.find((entry) => entry.actorId === identity.actorId);
        const events = identity.actorId ? actorEvents.get(identity.actorId) ?? [] : [];
        const unregistered = events.some((fact) => fact.kind === "actor_unregistered" &&
          fact.actorId === identity.actorId && fact.sequence > completion.terminalSequence &&
          fact.sequence <= afterSequence);
        const reused = events.some((fact) => fact.kind === "actor_registered" &&
          fact.actor.actorId === identity.actorId && fact.sequence > completion.registeredSequence &&
          fact.sequence <= afterSequence);
        if (reused || (actor && (unregistered || actor.objectName !== identity.objectName ||
          actor.canonicalObjectName !== identity.canonicalObjectName || actor.playerNumber !== identity.playerNumber))) {
          failures.push("production_effect_actor_identity_reused"); continue;
        }
        if (!actor && snapshot.gaps.length) {
          gaps.add("production_effect_owned_world_incomplete");
        } else {
          state = actor?.active && actor.alive && actor.finished && actor.indexed ? "present" : "absent";
          currentLevel = state === "present" && actor ? actor.currentLevel : null;
        }
      } else if (completion.researchType !== null) {
        state = snapshot.completedResearch.includes(completion.researchType) ? "present" : "absent";
        if (state === "absent") failures.push("production_effect_registered_research_missing");
      }
      if (state !== "present") gaps.add("production_effect_retained_sample_missing");
      samples.push({ tick: snapshot.tick, afterSequence, state, currentLevel });
    }
    if (!samples.length) gaps.add("production_effect_post_terminal_samples_missing");
    effects.push({ completion, acceptedDecision: origin?.decision?.decision.identity ?? null,
      acceptedDemandId: origin?.acceptedIntent.demandId ?? null, samples });
  }
  if (completions.length) {
    gaps.add("production_effect_continuous_stability_missing");
    gaps.add("production_effect_strategic_usefulness_missing");
  }
  return structuredClone({ effects: failures.length ? [] : effects, failures: [...new Set(failures)], gaps: [...gaps].sort() });
}
