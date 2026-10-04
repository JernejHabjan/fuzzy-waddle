import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { sampleQueueResourceBalance, sampleQueueResourceVector } from "../../../data/queue-resource-samples";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService, getSceneSystem } from "../../../world/services/scene-component-helpers";
import { AiPlayerHandler } from "../ai-player-handler";
import { projectAiProductionObligations } from "../observation/ai-production-obligations";
import { captureAiRuntimeProductionQueue } from "./ai-runtime-production-queues";
import type { AiRuntimePendingCommands } from "./ai-runtime-pending-commands";
import type { AiRuntimeUnspentClaimsV1 } from "./ai-runtime-unspent-claims-v1";
import type { AiRuntimeProductionBoundaryState } from "./ai-runtime-production-boundary-state";

const MAX_ACTORS = 256;
const MAX_ITEMS = 2048;
const MAX_RESERVATIONS = 512;

/** Passive operation-time projection. Invalid/truncated authority stays null and diagnostic failure stays local. */
export function projectAiRuntimeProductionBoundaryState(
  scene: ProbableWaffleScene,
  playerNumber: number,
  pendingCommands: AiRuntimePendingCommands,
  identify: (actorId: string, item: UnifiedQueueItem) => string,
  unspentClaims?: AiRuntimeUnspentClaimsV1,
  exhaustedProgressItem?: UnifiedQueueItem
): AiRuntimeProductionBoundaryState {
  const gaps = new Set<string>(unspentClaims?.gaps ?? []);
  if (!unspentClaims?.resources) gaps.add("production_boundary_unspent_reconciliation_missing");
  let exhaustedProgressItemId: string | undefined;
  const pending = pendingCommands.snapshot(playerNumber);
  pending.gaps.forEach((gap) => gaps.add(gap));
  let resources: AiRuntimeProductionBoundaryState["resources"] = null;
  try { resources = sampleQueueResourceBalance(scene, playerNumber); }
  catch { gaps.add("production_boundary_resources_unavailable"); }
  if (!resources) gaps.add("production_boundary_resources_missing");
  let brain: AiRuntimeProductionBoundaryState["brain"] = null;
  let queues: AiRuntimeProductionBoundaryState["queues"] = null;
  let obligations: AiRuntimeProductionBoundaryState["obligations"] = null;
  try {
    const state = getSceneSystem(scene, AiPlayerHandler)?.getAiPlayerController(playerNumber)?.getBrainState();
    if (state && state.reservations.length <= MAX_RESERVATIONS) brain = {
      lastCommittedTick: state.lastCommittedTick, decisionSequence: state.scheduler.decisionSequence,
      reservations: state.reservations
    };
    else gaps.add(state ? "production_boundary_reservations_overflow" : "production_boundary_brain_missing");
  } catch {
    gaps.add("production_boundary_brain_unavailable");
  }
  try {
    const index = getSceneService(scene, ActorIndexSystem);
    if (!index) gaps.add("production_boundary_actor_index_missing");
    else {
      const actors = index.getOwnedActors(playerNumber).filter((actor) => actor.scene === scene && actor.active &&
        !getActorComponent(actor, HealthComponent)?.killed);
      if (actors.length > MAX_ACTORS) gaps.add("production_boundary_actor_overflow");
      else {
        const items = actors.flatMap((actor) => getActorComponent(actor, QueueComponent)?.allItems ?? []);
        if (items.length > MAX_ITEMS) gaps.add("production_boundary_item_overflow");
        else {
          queues = actors.flatMap((actor) => {
            const queue = captureAiRuntimeProductionQueue(actor, identify);
            if (!queue && getActorComponent(actor, QueueComponent)) throw new Error("queue_identity_missing");
            return queue ? [queue] : [];
          }).sort((left, right) => left.actorId.localeCompare(right.actorId));
          if (queues.some((queue) => queue.lanes.some((lane) => lane.items.some((item) =>
            item.payment === "unknown" || !sampleQueueResourceVector(item.charge) ||
            !Number.isFinite(item.totalTimeMs) || !Number.isFinite(item.remainingTimeMs) ||
            item.totalTimeMs < 0 || item.remainingTimeMs < 0 || item.remainingTimeMs > item.totalTimeMs)))) {
            throw new Error("queue_cost_or_progress_invalid");
          }
          if (exhaustedProgressItem) {
            const actor = actors.find((candidate) => getActorComponent(candidate, QueueComponent)?.queues.some((lane) =>
              lane.queuedItems[0] === exhaustedProgressItem));
            const queue = actor ? captureAiRuntimeProductionQueue(actor, identify) : null;
            if (!queue || exhaustedProgressItem.remainingTime !== 0) throw new Error("exhausted_progress_item_missing");
            exhaustedProgressItemId = identify(queue.actorId, exhaustedProgressItem);
          }
          // Only the actually advanced zero head has exhausted its charges; an unprocessed zero-time head still owes one.
          obligations = projectAiProductionObligations(items.filter((item) => item !== exhaustedProgressItem));
        }
      }
    }
  } catch {
    // Preserve absence instead of aborting an ordinary shared command because test diagnostics cannot project it.
    exhaustedProgressItemId = undefined;
    queues = null;
    obligations = null;
    gaps.add("production_boundary_queue_authority_invalid");
  }
  return structuredClone({ resources, brain, pendingCommands: pending.commands, pendingResourceClaims: pending.resources,
    queues, obligations, unspentClaims, exhaustedProgressItemId, gaps: [...gaps].sort() } satisfies AiRuntimeProductionBoundaryState);
}
