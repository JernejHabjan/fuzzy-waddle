import type Phaser from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import type { OrderData } from "../../../ai/OrderData";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import type { PawnAiBlackboard } from "../../../prefabs/ai-agents/pawn-ai-blackboard";
import { PawnOrderObservation } from "../../../prefabs/ai-agents/pawn-order-observation";
import type { ProductionSpatialAuthorityEvent } from "../../../world/services/multiplayer/production-spatial-authority-event";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import type { AiRuntimeRouteOrderV1 } from "./ai-runtime-route-order-v1";
import { MovementQueryObservation } from "../../../entity/systems/movement-query-observation";
import type { MovementQueryContext } from "../../../entity/systems/movement-query-context";
import type { AiRuntimeRouteCallerV1 } from "./ai-runtime-route-caller-v1";

/** Test-owned bounded weak order identities and subscriptions. Current-order overlap never supplies caller authority. */
export class AiRuntimeRouteOrderCapture {
  private disposed = false;
  private nextOrderId = 1;
  private bindingCount = 0;
  private nextInvocationId = 1;
  private callers = new WeakMap<MovementQueryContext,
    { invocationId: number; order: AiRuntimeRouteOrderV1 | null; lifetime: object; restoreToken: object }>();
  private identities = new WeakMap<OrderData,
    { orderId: number; actor: Phaser.GameObjects.GameObject; lifetime: object; restoreToken: object;
      admissionObserved: boolean; outputId: number | null }>();
  private outputs = new WeakMap<Phaser.GameObjects.GameObject,
    { outputId: number; event: Extract<ProductionSpatialAuthorityEvent, { kind: "output" }> }>();
  private readonly actors = new Map<Phaser.GameObjects.GameObject,
    { board: PawnAiBlackboard; restoreToken: object; release: () => void }>();

  constructor(private readonly scene: Phaser.Scene,
    private readonly boundary: () => Pick<AiRuntimeProductionSpatialV1,
      "clockTick" | "snapshotRestoreInProgress" | "sceneActive">,
    private readonly append: (owner: number, value: AiRuntimeProductionSpatialV1) => void) {}

  bindOutput(event: Extract<ProductionSpatialAuthorityEvent, { kind: "output" }>, outputId: number): void {
    if (this.disposed || outputId > 256) return;
    this.outputs.set(event.product, { event, outputId });
    this.watchActor(event.product);
  }

  /** Reuses the root capture's existing actor inventory; no new scene scan or tick subscription. */
  watchActor(actor: Phaser.GameObjects.GameObject): void {
    if (this.disposed || actor.scene !== this.scene) return;
    try {
      const board = getActorComponent(actor, PawnAiController)?.blackboard;
      const previous = this.actors.get(actor);
      if (previous?.board === board) return;
      if (previous) {
        this.unwatchActor(actor);
        const source = captureAiRuntimeCreatedActor(actor);
        if (source.playerNumber !== null) this.emit(source.playerNumber, { ...this.boundary(), kind: "route_order_restore",
          reason: "controller_replaced", source, gaps: [] });
      }
      if (!board || this.bindingCount >= 256) return;
      this.bindingCount++;
      const state = { board, restoreToken: {}, release: () => undefined as void };
      const original = board.setData;
      const descriptor = Object.getOwnPropertyDescriptor(board, "setData");
      const unsubscribeCaller = MovementQueryObservation.subscribe(board, (context) => {
        if (this.disposed || context.actor !== actor || this.actors.get(actor) !== state || this.nextInvocationId > 8192) return;
        const order = context.order ? this.snapshot(actor, context.order, false) : null;
        if (order === undefined) return;
        this.callers.set(context, { invocationId: this.nextInvocationId++, order,
          lifetime: state, restoreToken: state.restoreToken });
      });
      const unsubscribe = PawnOrderObservation.subscribe(board, (order, origin) => {
        if (this.disposed || this.actors.get(actor) !== state) return;
        const source = captureAiRuntimeCreatedActor(actor);
        if (source.playerNumber === null || !source.actorId) return;
        const value = this.snapshot(actor, order, !origin);
        if (!value) return;
        if (!origin) this.emit(source.playerNumber, { ...this.boundary(), kind: "route_order", source, order: value, gaps: [] });
        else {
          const output = this.outputs.get(actor);
          const identity = this.identities.get(order);
          if (!output || !identity || output.event.producer !== origin.producer || output.event.item !== origin.item ||
            !["actor_action", "tile_action"].includes(output.event.rallyMode) || value.commandContext) return;
          identity.outputId = output.outputId;
          this.emit(source.playerNumber, { ...this.boundary(), kind: "route_rally_order", source,
            orderId: identity.orderId, outputId: output.outputId, gaps: [] });
        }
      });
      const wrapper: typeof original = (...args) => {
        // Fence even failed or partial restores before invoking the original mutator once.
        state.restoreToken = {};
        this.outputs.delete(actor);
        try {
          const source = captureAiRuntimeCreatedActor(actor);
          if (source.playerNumber !== null) this.emit(source.playerNumber,
            { ...this.boundary(), kind: "route_order_restore", reason: "restore_attempt", source, gaps: [] });
        } catch { /* Preserve native restore. */ }
        return original.apply(board, args);
      };
      state.release = () => {
        unsubscribe();
        unsubscribeCaller();
        try {
          if (board.setData === wrapper) {
            if (descriptor) Object.defineProperty(board, "setData", descriptor);
            else Reflect.deleteProperty(board, "setData");
          }
        } catch { /* Failed diagnostic teardown cannot replace a native result or later method owner. */ }
      };
      try { board.setData = wrapper; }
      catch { state.release(); return; }
      this.actors.set(actor, state);
    } catch { /* Missing observation cannot be filled by a later object/name match. */ }
  }

  unwatchActor(actor: Phaser.GameObjects.GameObject): void {
    this.actors.get(actor)?.release(); this.actors.delete(actor); this.outputs.delete(actor);
  }

  sample(actor: Phaser.GameObjects.GameObject): AiRuntimeRouteOrderV1 | null | undefined {
    if (this.disposed) return undefined;
    try {
      this.watchActor(actor);
      const state = this.actors.get(actor);
      if (!state) return undefined;
      const order = state.board.getCurrentOrder();
      return order ? this.snapshot(actor, order, false) : null;
    } catch { return undefined; }
  }

  /** Uses the invocation's detached order, never the current order after an await or restore. */
  caller(actor: Phaser.GameObjects.GameObject,
    active: ReturnType<typeof MovementQueryObservation.current>): AiRuntimeRouteCallerV1 | undefined {
    if (this.disposed || !active || active.context.actor !== actor) return undefined;
    try {
      this.watchActor(actor);
      const stored = this.callers.get(active.context), state = this.actors.get(actor);
      if (!stored) return undefined;
      return structuredClone({ invocationId: stored.invocationId, caller: active.context.caller, stage: active.stage,
        order: stored.order, lifetimeValid: !!state && state.board === active.context.board &&
          stored.lifetime === state && stored.restoreToken === state.restoreToken });
    } catch { return undefined; }
  }

  dispose(): void {
    this.disposed = true;
    this.actors.forEach((state) => state.release()); this.actors.clear();
    this.identities = new WeakMap(); this.outputs = new WeakMap();
    this.callers = new WeakMap();
  }

  private snapshot(actor: Phaser.GameObjects.GameObject, order: OrderData, admitted: boolean): AiRuntimeRouteOrderV1 | undefined {
    const state = this.actors.get(actor);
    if (!state) return undefined;
    let identity = this.identities.get(order);
    if (!identity || identity.actor !== actor || identity.lifetime !== state || identity.restoreToken !== state.restoreToken) {
      if (this.nextOrderId > 8192) return undefined;
      identity = { orderId: this.nextOrderId++, actor, lifetime: state, restoreToken: state.restoreToken,
        admissionObserved: admitted, outputId: null };
      this.identities.set(order, identity);
    }
    if (admitted) identity.admissionObserved = true;
    if ((order.data.commandContext?.actorIds.length ?? 0) > 256) return undefined;
    return structuredClone({ orderId: identity.orderId, orderType: order.orderType,
      target: order.data.targetGameObject ? captureAiRuntimeCreatedActor(order.data.targetGameObject) : null,
      targetTile: order.data.targetTileLocation ?? null, commandContext: order.data.commandContext ?? null,
      originOutputId: identity.outputId, admissionObserved: identity.admissionObserved });
  }

  private emit(owner: number, value: AiRuntimeProductionSpatialV1): void {
    try { this.append(owner, structuredClone(value)); } catch { /* Preserve the native queue/action result. */ }
  }
}
