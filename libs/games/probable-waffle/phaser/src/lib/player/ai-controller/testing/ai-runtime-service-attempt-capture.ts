import type Phaser from "phaser";
import type { OrderData } from "../../../ai/OrderData";
import type { PawnAiBlackboard } from "../../../prefabs/ai-agents/pawn-ai-blackboard";
import { PawnResourceServiceObservation } from "../../../prefabs/ai-agents/pawn-resource-service-observation";
import type { AiRuntimeRouteOrderV1 } from "./ai-runtime-route-order-v1";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";

/** Test-owned weak attempts reuse order identities and actor subscriptions; no scene scans or money inference. */
export class AiRuntimeServiceAttemptCapture {
  private nextId = 1;
  private readonly identities = new WeakMap<object,
    { id: number; order: AiRuntimeRouteOrderV1 | undefined; restoreToken: object | undefined }>();

  constructor(private readonly scene: Phaser.Scene,
    private readonly boundary: () => Pick<AiRuntimeProductionSpatialV1,
      "clockTick" | "snapshotRestoreInProgress" | "sceneActive">,
    private readonly snapshot: (actor: Phaser.GameObjects.GameObject, order: OrderData) => AiRuntimeRouteOrderV1 | undefined,
    private readonly append: (owner: number, value: AiRuntimeProductionSpatialV1) => void) {}

  /** The owner's token getter detects restore, unwatch/reuse and controller replacement independently of current order. */
  watch(actor: Phaser.GameObjects.GameObject, board: PawnAiBlackboard, token: () => object | undefined): () => void {
    return PawnResourceServiceObservation.subscribe(board, (event) => {
      try {
        if (event.actor !== actor || event.board !== board) return;
        let identity = this.identities.get(event.execution);
        if (!identity) {
          if (event.phase !== "started" || this.nextId > 8192) return;
          const restoreToken = token();
          identity = { id: this.nextId++, order: this.snapshot(actor, event.order), restoreToken };
          this.identities.set(event.execution, identity);
        }
        const source = captureAiRuntimeCreatedActor(actor);
        if (source.playerNumber === null) return;
        this.append(source.playerNumber, structuredClone({ ...this.boundary(), kind: "service_attempt",
          attemptId: identity.id, operation: event.operation, phase: event.phase, amount: event.amount,
          source, target: captureAiRuntimeCreatedActor(event.target), sourceInCaptureScene: actor.scene === this.scene,
          targetInCaptureScene: event.target.scene === this.scene, order: identity.order,
          lifetimeValid: !!identity.restoreToken && token() === identity.restoreToken,
          gaps: identity.order ? [] : ["production_service_attempt_order_missing"] } satisfies AiRuntimeProductionSpatialV1));
      } catch { /* Failed or lost diagnostics never retry or replace the native callee. */ }
    });
  }
}
