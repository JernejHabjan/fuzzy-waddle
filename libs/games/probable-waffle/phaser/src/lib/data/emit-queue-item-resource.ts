import type Phaser from "phaser";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { emitResource, getCommunicator, isSnapshotApplyInProgress } from "./scene-data";
import { QUEUE_RESOURCE_EMISSION_EVENT, type QueueResourceEmissionEvent } from "./queue-resource-emission-event";
import type { QueueResourceEmissionScope } from "./queue-resource-emission-scope";
import { sampleQueueResourceBalance, sampleQueueResourceVector } from "./queue-resource-samples";

const scopeSequences = new WeakMap<Phaser.Scene, number>();
const activeScopes = new WeakMap<Phaser.Scene, { nested: boolean }>();
const MAX_CALLBACKS = 8;

/**
 * Forward one actual shared resource emission. Marked captures receive operation-scoped samples and exact callback
 * identity; ordinary scenes take the original emitter path. This neither changes prices nor promises refund credit.
 * Shared callers supply the physical item and separate applied cancellation, including before insertion/after removal.
 */
export function emitQueueItemResource(scope: QueueResourceEmissionScope): void {
  const scene = scope.producer.scene;
  const action = scope.operation === "cancellation_refund" ? "resource.added" : "resource.removed";
  if (!scene.events.listenerCount(QUEUE_RESOURCE_EMISSION_EVENT)) {
    emitResource(scene, action, scope.amounts, scope.playerNumber);
    return;
  }
  const operationId = (scopeSequences.get(scene) ?? 0) + 1;
  scopeSequences.set(scene, operationId);
  const common = {
    scope, operationId, requested: sampleQueueResourceVector(scope.amounts),
    before: sampleQueueResourceBalance(scene, scope.playerNumber),
    snapshotRestoreInProgress: isSnapshotApplyInProgress(scene)
  };
  const callbacks: { count: number; amounts: Partial<Record<ResourceType, number>> | null; nested: boolean } = {
    count: 0, amounts: null, nested: false
  };
  let returned = false;
  const subscription = getCommunicator(scene).playerChanged?.on.subscribe((event) => {
    // Equal prices do not imply lineage. The shared local communicator retains this exact input object.
    if (activeScopes.get(scene) !== callbacks || event.property !== action || event.data.playerNumber !== scope.playerNumber ||
      event.data.playerStateData?.resources !== scope.amounts) return;
    callbacks.count = Math.min(MAX_CALLBACKS + 1, callbacks.count + 1);
    if (callbacks.count > MAX_CALLBACKS) return;
    callbacks.amounts = sampleQueueResourceVector(event.data.playerStateData.resources);
    scene.events.emit(QUEUE_RESOURCE_EMISSION_EVENT, {
      ...common, phase: "callback", callbackOrdinal: callbacks.count, amounts: callbacks.amounts
    } satisfies QueueResourceEmissionEvent);
  });
  const parentScope = activeScopes.get(scene);
  if (parentScope) parentScope.nested = true;
  activeScopes.set(scene, callbacks);
  try {
    scene.events.emit(QUEUE_RESOURCE_EMISSION_EVENT, { ...common, phase: "started" } satisfies QueueResourceEmissionEvent);
    emitResource(scene, action, scope.amounts, scope.playerNumber);
    returned = true;
  } finally {
    subscription?.unsubscribe();
    if (parentScope) activeScopes.set(scene, parentScope);
    else activeScopes.delete(scene);
    const after = sampleQueueResourceBalance(scene, scope.playerNumber);
    const before = common.before;
    const requested = common.requested;
    const observed = callbacks.amounts;
    const sign = action === "resource.added" ? 1 : -1;
    const balanceMatches = !callbacks.nested && callbacks.count === 1 && before !== null && after !== null && requested !== null &&
      observed !== null && Object.values(ResourceType).every((resource) => {
        const amount = requested[resource] ?? 0;
        const expected = before[resource] + sign * amount;
        return Number.isFinite(expected) && after[resource] === expected && amount === (observed[resource] ?? 0);
      });
    scene.events.emit(QUEUE_RESOURCE_EMISSION_EVENT, {
      ...common, phase: "finished", status: returned ? "returned" : "threw", after,
      callbackCount: callbacks.count, callbackLimitExceeded: callbacks.count > MAX_CALLBACKS,
      nestedEmission: callbacks.nested, balanceMatches
    } satisfies QueueResourceEmissionEvent);
  }
}

/** Observe the shared failed-tick branch without emission, fabricated callbacks or advancing the item's progress. */
export function recordQueueItemPaymentDenied(scope: QueueResourceEmissionScope & { operation: "tick_charge" }): void {
  const scene = scope.producer.scene;
  if (!scene.events.listenerCount(QUEUE_RESOURCE_EMISSION_EVENT)) return;
  const operationId = (scopeSequences.get(scene) ?? 0) + 1;
  scopeSequences.set(scene, operationId);
  scene.events.emit(QUEUE_RESOURCE_EMISSION_EVENT, {
    scope, operationId, requested: sampleQueueResourceVector(scope.amounts),
    before: sampleQueueResourceBalance(scene, scope.playerNumber),
    snapshotRestoreInProgress: isSnapshotApplyInProgress(scene),
    phase: "denied", reason: "insufficient_resources"
  } satisfies QueueResourceEmissionEvent);
}
