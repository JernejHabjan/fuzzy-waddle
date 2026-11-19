import type Phaser from "phaser";
import type { PawnAiBlackboard } from "../../../../../prefabs/ai-agents/controller/pawn-ai-blackboard";
import { MovementCompletionObservation } from "../../../../../entity/systems/movement-completion-observation";
import type { MovementQueryContext } from "../../../../../entity/systems/movement-query-context";
import type { AiRuntimeRouteCaller } from "../controls/ai-runtime-route-caller";
import type { AiRuntimeProductionSpatial } from "../../production/world/ai-runtime-production-spatial";
import { captureAiRuntimeCreatedActor } from "../../harness/capture/capture-ai-runtime-created-actor";

/** Reuses marked order subscriptions and existing root actor inventory. Weak execution identities cap at 8,192. */
export class AiRuntimeMovementCapture {
  private nextId = 1;
  private readonly identities = new WeakMap<object, number>();

  constructor(private readonly scene: Phaser.Scene,
    private readonly boundary: () => Pick<AiRuntimeProductionSpatial,
      "clockTick" | "snapshotRestoreInProgress" | "sceneActive">,
    private readonly caller: (actor: Phaser.GameObjects.GameObject, context: MovementQueryContext) =>
      AiRuntimeRouteCaller | undefined,
    private readonly append: (owner: number, value: AiRuntimeProductionSpatial) => void) {}

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
          gaps: caller ? [] : ["production_movement_caller_missing"] } satisfies AiRuntimeProductionSpatial));
      } catch { /* Missing diagnostic events never change native movement. */ }
    });
  }
}
