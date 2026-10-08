import type Phaser from "phaser";
import { ResourceServiceObservation } from "../../../entity/components/resource/resource-service-observation";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import type { AiRuntimeResourceCoverageCapture } from "./ai-runtime-resource-coverage-capture";
import { readAiRuntimeResourceOperationId } from "./ai-runtime-resource-operation-identity";

/** Reuses marked actor subscriptions and current component authority. Fresh cargo never rebinds an old execution/transfer. */
export class AiRuntimeResourceServiceCapture {
  private nextCargoId = 1;
  private nextTransferId = 1;
  private executionCount = 0;
  private readonly executions = new WeakMap<object, { cargoId: number; watch: object; token: object | undefined }>();
  private readonly cargo = new WeakMap<object, { id: number; watch: object; token: object | undefined }>();
  private readonly transfers = new WeakMap<object, { id: number; cargoId: number; token: object | undefined; watch: object }>();

  constructor(private readonly scene: Phaser.Scene,
    private readonly boundary: () => Pick<AiRuntimeProductionSpatialV1,
      "clockTick" | "snapshotRestoreInProgress" | "sceneActive">,
    private readonly attempt: (execution?: object) => { attemptId: number; lifetimeValid: boolean } | undefined,
    private readonly append: (owner: number, value: AiRuntimeProductionSpatialV1) => void,
    private readonly liveCargo?: (actor: Phaser.GameObjects.GameObject) => object | undefined,
    private readonly coverage?: AiRuntimeResourceCoverageCapture) {}

  watch(actor: Phaser.GameObjects.GameObject, token: () => object | undefined): () => void {
    const watch = {};
    return ResourceServiceObservation.subscribe(actor, (event) => {
      const restoring = event.kind === "cargo_changed" && event.change.reason === "restore";
      const oldCargo = event.kind === "cargo_changed" ? this.cargo.get(event.cargoOwner) : undefined;
      // Fence before readers/append: a lost restore diagnostic must still invalidate the old transfer handle.
      if (restoring && event.kind === "cargo_changed") this.cargo.delete(event.cargoOwner);
      try {
        const current = token();
        const live = this.liveCargo?.(actor), installedSource = captureAiRuntimeCreatedActor(actor);
        if (live && installedSource.actorId && installedSource.playerNumber !== null &&
          installedSource.active && installedSource.alive && installedSource.indexed) {
          this.coverage?.install(live, installedSource.actorId, installedSource.playerNumber);
        }
        const context = event.kind === "cargo_changed" || event.kind === "cargo_started" ? undefined : event.context;
        const cargoOwner = event.kind === "cargo_changed" || event.kind === "cargo_started" ? event.cargoOwner : context?.cargoOwner;
        let cargo = restoring ? oldCargo : cargoOwner ? this.cargo.get(cargoOwner) : undefined;
        if (cargoOwner && (!cargo || cargo.watch !== watch || cargo.token !== current)) {
          if (this.nextCargoId > 8192) { this.coverage?.lose("cargo_identity_overflow"); return; }
          cargo = { id: this.nextCargoId++, watch, token: current };
          if (!restoring) this.cargo.set(cargoOwner, cargo);
        }
        const transferToken = event.kind === "cargo_changed" ? event.change.transfer : context?.transfer;
        let transfer = transferToken ? this.transfers.get(transferToken) : undefined;
        if (event.kind === "cargo_offered" && transferToken && cargo) {
          if (transfer || this.nextTransferId > 8192) { this.coverage?.lose("transfer_identity_loss"); return; }
          transfer = { id: this.nextTransferId++, cargoId: cargo.id, token: current, watch };
          this.transfers.set(transferToken, transfer);
        }
        const execution = event.kind === "cargo_changed" ? event.change.execution :
          event.kind === "cargo_started" ? event.execution : context?.execution;
        if (event.kind === "cargo_started" && execution && cargo && !this.executions.has(execution)) {
          if (this.executionCount >= 8192) { this.coverage?.lose("execution_identity_overflow"); return; }
          this.executionCount++;
          this.executions.set(execution, { cargoId: cargo.id, watch, token: current });
        }
        const entry = execution ? this.executions.get(execution) : undefined;
        const attempt = this.attempt(execution);
        const target = event.kind === "cargo_changed" ? event.change.target : event.target;
        const source = installedSource;
        if (source.playerNumber === null) { this.coverage?.lose("resource_owner_missing"); return; }
        const common = { ...this.boundary(), kind: "resource_service" as const, source,
          target: target ? captureAiRuntimeCreatedActor(target) : null, sourceInCaptureScene: actor.scene === this.scene,
          targetInCaptureScene: target ? target.scene === this.scene : null,
          cargoId: transfer?.cargoId ?? cargo?.id ?? null, attemptId: attempt?.attemptId ?? null, transferId: transfer?.id ?? null,
          lifetimeValid: !!current && !!cargoOwner && live === cargoOwner &&
            (!execution || attempt?.lifetimeValid === true) &&
            (!execution || entry?.watch === watch && entry.token === current && entry.cargoId === cargo?.id) &&
            (!transfer || transfer.watch === watch && transfer.token === current && transfer.cargoId === cargo?.id), gaps: [] };
        if (!common.lifetimeValid || common.snapshotRestoreInProgress || !common.sceneActive) {
          this.coverage?.lose("resource_lifetime_unavailable");
        }
        if (event.kind === "cargo_changed") {
          this.append(source.playerNumber, structuredClone({ ...common, phase: "cargo_changed",
            change: { reason: event.change.reason, resourceType: event.change.resourceType, delta: event.change.delta },
            before: event.before, after: event.after } satisfies AiRuntimeProductionSpatialV1));
        } else if (event.kind === "cargo_offered" || event.kind === "cargo_started") {
          this.append(source.playerNumber, structuredClone({ ...common, phase: event.kind, cargo: event.cargo }
            satisfies AiRuntimeProductionSpatialV1));
        } else {
          if (event.status === "returned" && (!event.before || !event.after || event.callbackCount !== 1 || event.interference)) {
            this.coverage?.lose("resource_credit_authority_unavailable");
          }
          const { actor: _actor, context: _context, target: _target, kind: _kind,
            application,
            snapshotRestoreInProgress: emissionRestoreInProgress, ...credit } = event;
          this.append(source.playerNumber, structuredClone({ ...common, ...credit, emissionRestoreInProgress,
            operationId: readAiRuntimeResourceOperationId(this.scene, application),
            phase: "resource_credit" } satisfies AiRuntimeProductionSpatialV1));
        }
      } catch { this.coverage?.lose("resource_projection_failed"); }
    }, this.coverage?.lose, () => {
      if (!this.coverage) return;
      const component = this.liveCargo?.(actor), source = captureAiRuntimeCreatedActor(actor);
      if (component && source.actorId && source.playerNumber !== null && source.active && source.alive && source.indexed) {
        this.coverage?.install(component, source.actorId, source.playerNumber);
      }
    });
  }
}
