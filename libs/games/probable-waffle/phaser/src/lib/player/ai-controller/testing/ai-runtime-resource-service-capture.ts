import type Phaser from "phaser";
import { ResourceServiceObservation } from "../../../entity/components/resource/resource-service-observation";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";

/** Reuses marked actor subscriptions. Restores/rebinding create fresh cargo identities; old transfers retain old fences. */
export class AiRuntimeResourceServiceCapture {
  private nextCargoId = 1;
  private nextTransferId = 1;
  private readonly cargo = new WeakMap<object, { id: number; watch: object; token: object | undefined }>();
  private readonly transfers = new WeakMap<object, { id: number; cargoId: number; token: object | undefined; watch: object }>();

  constructor(private readonly scene: Phaser.Scene,
    private readonly boundary: () => Pick<AiRuntimeProductionSpatialV1,
      "clockTick" | "snapshotRestoreInProgress" | "sceneActive">,
    private readonly attempt: (execution?: object) => { attemptId: number; lifetimeValid: boolean } | undefined,
    private readonly append: (owner: number, value: AiRuntimeProductionSpatialV1) => void) {}

  watch(actor: Phaser.GameObjects.GameObject, token: () => object | undefined): () => void {
    const watch = {};
    return ResourceServiceObservation.subscribe(actor, (event) => {
      try {
        const current = token();
        const context = event.kind === "cargo_changed" ? undefined : event.context;
        const cargoOwner = event.kind === "cargo_changed" ? event.cargoOwner : context?.cargoOwner;
        let cargo = cargoOwner ? this.cargo.get(cargoOwner) : undefined;
        if (cargoOwner && (!cargo || cargo.watch !== watch || cargo.token !== current)) {
          if (this.nextCargoId > 8192) return;
          cargo = { id: this.nextCargoId++, watch, token: current }; this.cargo.set(cargoOwner, cargo);
        }
        const transferToken = event.kind === "cargo_changed" ? event.change.transfer : context?.transfer;
        let transfer = transferToken ? this.transfers.get(transferToken) : undefined;
        if (event.kind === "cargo_offered" && transferToken && cargo) {
          if (transfer || this.nextTransferId > 8192) return;
          transfer = { id: this.nextTransferId++, cargoId: cargo.id, token: current, watch };
          this.transfers.set(transferToken, transfer);
        }
        const execution = event.kind === "cargo_changed" ? event.change.execution : context?.execution;
        const attempt = this.attempt(execution);
        const target = event.kind === "cargo_changed" ? event.change.target : event.target;
        const source = captureAiRuntimeCreatedActor(actor);
        if (source.playerNumber === null) return;
        const common = { ...this.boundary(), kind: "resource_service" as const, source,
          target: target ? captureAiRuntimeCreatedActor(target) : null, sourceInCaptureScene: actor.scene === this.scene,
          targetInCaptureScene: target ? target.scene === this.scene : null,
          cargoId: transfer?.cargoId ?? cargo?.id ?? null, attemptId: attempt?.attemptId ?? null, transferId: transfer?.id ?? null,
          lifetimeValid: !!current && (!execution || attempt?.lifetimeValid === true) &&
            (!transfer || transfer.watch === watch && transfer.token === current), gaps: [] };
        if (event.kind === "cargo_changed") {
          this.append(source.playerNumber, structuredClone({ ...common, phase: "cargo_changed",
            change: { reason: event.change.reason, resourceType: event.change.resourceType, delta: event.change.delta },
            before: event.before, after: event.after } satisfies AiRuntimeProductionSpatialV1));
          if (event.change.reason === "restore" && cargoOwner) this.cargo.delete(cargoOwner);
        } else if (event.kind === "cargo_offered") {
          this.append(source.playerNumber, structuredClone({ ...common, phase: "cargo_offered", cargo: event.cargo }
            satisfies AiRuntimeProductionSpatialV1));
        } else {
          const { actor: _actor, context: _context, target: _target, kind: _kind,
            snapshotRestoreInProgress: emissionRestoreInProgress, ...credit } = event;
          this.append(source.playerNumber, structuredClone({ ...common, ...credit, emissionRestoreInProgress, phase: "resource_credit" }
            satisfies AiRuntimeProductionSpatialV1));
        }
      } catch { /* Capture loss is not repaired from a later pile, order or balance. */ }
    });
  }
}
