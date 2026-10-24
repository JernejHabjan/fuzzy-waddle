import type Phaser from "phaser";
import type { PawnAiBlackboard } from "../../../prefabs/ai-agents/pawn-ai-blackboard";
import { MovementCompletionObservation } from "../../../entity/systems/movement-completion-observation";
import type { MovementQueryContext } from "../../../entity/systems/movement-query-context";
import type { AiRuntimeRouteCallerV1 } from "./ai-runtime-route-caller-v1";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";

/** Reuses marked order subscriptions and existing root actor inventory. Weak execution identities cap at 8,192. */
export class AiRuntimeMovementCapture {
  private nextId = 1;
  private readonly identities = new WeakMap<object, number>();

  constructor(private readonly scene: Phaser.Scene,
    private readonly boundary: () => Pick<AiRuntimeProductionSpatialV1,
      "clockTick" | "snapshotRestoreInProgress" | "sceneActive">,
    private readonly caller: (actor: Phaser.GameObjects.GameObject, context: MovementQueryContext) =>
      AiRuntimeRouteCallerV1 | undefined,
    private readonly append: (owner: number, value: AiRuntimeProductionSpatialV1) => void) {}

  watch(actor: Phaser.GameObjects.GameObject, board: PawnAiBlackboard): () => void {
    return MovementCompletionObservation.subscribe(board, (event) => {
      try {
        if (event.context.actor !== actor) return;
        let executionId = this.identities.get(event.execution);
        if (!executionId) {
          if (event.phase !== "started" || this.nextId > 8192) return;
          executionId = this.nextId++; this.identities.set(event.execution, executionId);
        }
        const source = captureAiRuntimeCreatedActor(actor);
        if (source.playerNumber === null) return;
        const caller = this.caller(actor, event.context);
        this.append(source.playerNumber, structuredClone({ ...this.boundary(), kind: "movement", executionId,
          phase: event.phase, mode: event.mode, source, sourceInCaptureScene: actor.scene === this.scene,
          caller, originalDestination: event.originalDestination, selectedDestination: event.selectedDestination,
          fallback: event.fallback, actualTile: event.actualTile,
          gaps: caller ? [] : ["production_movement_caller_missing"] } satisfies AiRuntimeProductionSpatialV1));
      } catch { /* Missing diagnostic events never change native movement. */ }
    });
  }
}
