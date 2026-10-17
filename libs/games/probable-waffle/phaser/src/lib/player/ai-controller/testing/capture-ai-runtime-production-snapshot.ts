import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type Phaser from "phaser";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService, getSceneSystem } from "../../../world/services/scene-component-helpers";
import { AiPlayerHandler } from "../ai-player-handler";
import { projectAiProductionObligations } from "../observation/ai-production-obligations";
import { captureAiRuntimeProductionQueue } from "./ai-runtime-production-queues";
import { captureAiRuntimeProductionWorld } from "./capture-ai-runtime-production-world";
import type { AiRuntimeProductionCaptureV1 } from "./ai-runtime-production-capture-v1";
import type { AiRuntimePendingCommands } from "./ai-runtime-pending-commands";

/** Read-time snapshot is diagnostic only; planner inputs and native closed frontiers have distinct owners. */
export function captureAiRuntimeProductionSnapshot(
  scene: ProbableWaffleScene,
  playerNumber: number,
  requireDecision: boolean,
  context: {
    readonly startedTick: number;
    readonly afterSequence: number;
    readonly resources: AiRuntimeProductionCaptureV1["snapshots"][number]["resources"];
    readonly resourceCoverage: AiRuntimeProductionCaptureV1["resourceCoverage"];
    readonly pendingCommands: AiRuntimePendingCommands;
    readonly identify: (actorId: string, item: UnifiedQueueItem) => string;
    readonly watchQueue: (actor: Phaser.GameObjects.GameObject) => void;
  }
) {
  const tick = getSceneService(scene, SimulationTickService)?.currentTick ?? context.startedTick;
  const controller = requireDecision
    ? getSceneSystem(scene, AiPlayerHandler)?.getAiPlayerController(playerNumber)
    : undefined;
  if (requireDecision && tick > 0 && (!controller || !controller.isDecisionBoundarySettled())) {
    throw new Error("production_capture_boundary_unsettled");
  }
  const actors = (getSceneService(scene, ActorIndexSystem)?.getOwnedActors(playerNumber) ?? [])
    .filter((actor) => actor.scene === scene && actor.active && !getActorComponent(actor, HealthComponent)?.killed)
    .sort((a, b) =>
      (getActorComponent(a, IdComponent)?.id ?? "").localeCompare(getActorComponent(b, IdComponent)?.id ?? "")
    );
  actors.forEach((actor) => context.watchQueue(actor));
  const queues = actors.flatMap((actor) => {
    const queue = captureAiRuntimeProductionQueue(actor, context.identify);
    return queue ? [queue] : [];
  });
  const state = controller?.getBrainState();
  const pending = context.pendingCommands.snapshot(playerNumber);
  const snapshot = {
    tick,
    resourceCoverage: context.resourceCoverage,
    afterSequence: context.afterSequence,
    observation: controller?.getCommittedObservation() ?? null,
    capabilityCatalog: controller?.getCommittedCapabilityCatalog() ?? null,
    world: captureAiRuntimeProductionWorld(scene, playerNumber, actors),
    ownedActors: actors.flatMap((actor) => {
      const actorId = getActorComponent(actor, IdComponent)?.id;
      return actorId ? [{ actorId, objectName: actor.name }] : [];
    }),
    economyProduction: state?.economyProduction ?? null,
    reservations: state?.reservations ?? [],
    resources: context.resources,
    pendingCommands: pending.commands,
    pendingResourceClaims: pending.resources,
    obligations: projectAiProductionObligations(
      actors.flatMap((actor) => getActorComponent(actor, QueueComponent)?.allItems ?? [])
    ),
    queues,
    completedResearch: [...(getSceneService(scene, TechTreeService)?.getPlayerResearch(playerNumber) ?? [])].sort()
  } satisfies AiRuntimeProductionCaptureV1["snapshots"][number];
  return { snapshot, pending };
}
