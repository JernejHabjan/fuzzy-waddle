import type Phaser from "phaser";
import type { Subscription } from "rxjs";
import { type ConstructionStateEnum, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getCommunicator, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { sampleQueueResourceBalance, sampleQueueResourceVector } from "../../../data/queue-resource-samples";
import { CONSTRUCTION_AUTHORITY_EVENT, type ConstructionAuthorityEvent } from "./construction-authority-event";
import type { ConstructionAuthorityRecord } from "./construction-authority-record";
import type { ConstructionResourceScope } from "./construction-resource-scope";

const activeScopes = new WeakMap<Phaser.Scene, { nested: boolean }>();

/** Diagnostic failure cannot replace a native emitter result, exception, state transition or cleanup. */
function publish(event: ConstructionAuthorityEvent): void {
  try { event.site.scene.events.emit(CONSTRUCTION_AUTHORITY_EVENT, event); } catch { /* Capture loss stays unavailable. */ }
}

function balance(scene: Phaser.Scene, owner: number | undefined): Record<ResourceType, number> | null {
  if (owner === undefined) return null;
  try { return sampleQueueResourceBalance(scene, owner); } catch { return null; }
}

/** Emits only when a marked capture listens, after the native transition boundary chosen by the component. */
export function observeConstructionLifecycle(
  site: Phaser.GameObjects.GameObject, state: ConstructionStateEnum, remainingWorkMs: number,
  transition: Extract<ConstructionAuthorityRecord, { kind: "lifecycle" }>["transition"]
): void {
  if (!site.scene?.events?.listenerCount(CONSTRUCTION_AUTHORITY_EVENT)) return;
  try { publish({ site, kind: "lifecycle", state, remainingWorkMs, transition,
    snapshotRestoreInProgress: isSnapshotApplyInProgress(site.scene) }); } catch { /* No invented restore status. */ }
}

/** Observe one existing operation, exact synchronous callback identity and detached native definition before callbacks mutate it. */
export function observeConstructionResource(scope: ConstructionResourceScope, emit?: () => void): void {
  if (!scope.site.scene?.events?.listenerCount(CONSTRUCTION_AUTHORITY_EVENT)) { emit?.(); return; }
  let finish: ReturnType<typeof prepareResourceObservation>;
  try { finish = prepareResourceObservation(scope); } catch { emit?.(); return; }
  let status: Extract<ConstructionAuthorityRecord, { kind: "resource" }>["status"] = scope.noEmission ?? "threw";
  try {
    if (emit) { emit(); status = "returned"; }
  } finally {
    try { finish(status); } catch { /* Cleanup/projection cannot replace the native result or error. */ }
  }
}

/** Retains only one synchronous interval; the returned cleanup releases the exact subscription and parent scope. */
function prepareResourceObservation(scope: ConstructionResourceScope) {
  const scene = scope.site.scene;
  const before = balance(scene, scope.owner);
  const configuredCost = sampleQueueResourceVector(scope.definition.resources);
  const requested = scope.amounts === null ? null : sampleQueueResourceVector(scope.amounts);
  const configuredCostType = scope.definition.costType;
  const requiredWorkMs = scope.definition.productionTime;
  const snapshotRestoreInProgress = isSnapshotApplyInProgress(scene);
  const current: { nested: boolean; callbackCount: number; callbackAmounts: Partial<Record<ResourceType, number>> | null } =
    { nested: false, callbackCount: 0, callbackAmounts: null };
  const parent = activeScopes.get(scene);
  if (parent) parent.nested = true;
  activeScopes.set(scene, current);
  let subscription: Subscription | undefined;
  const action = scope.operation === "cancel_refund" ? "resource.added" : "resource.removed";
  try {
    subscription = getCommunicator(scene).playerChanged?.on.subscribe((event) => {
      if (activeScopes.get(scene) !== current || event.property !== action ||
        event.data.playerNumber !== scope.owner || event.data.playerStateData?.resources !== scope.amounts) return;
      current.callbackCount = Math.min(9, current.callbackCount + 1);
      current.callbackAmounts = sampleQueueResourceVector(event.data.playerStateData.resources);
    });
  } catch { /* Missing callback authority cannot turn a returned emitter into a charge. */ }
  return (status: Extract<ConstructionAuthorityRecord, { kind: "resource" }>["status"]): void => {
    try { subscription?.unsubscribe(); } finally {
      if (parent) activeScopes.set(scene, parent); else activeScopes.delete(scene);
    }
    const after = balance(scene, scope.owner);
    const sign = action === "resource.added" ? 1 : -1;
    const observed = current.callbackAmounts;
    const balanceMatches = status === "returned" && !snapshotRestoreInProgress && !current.nested && current.callbackCount === 1 &&
      before !== null && after !== null && requested !== null && observed !== null &&
      Object.values(ResourceType).every((resource) =>
        (requested[resource] ?? 0) === (observed[resource] ?? 0) &&
        after[resource] === before[resource] + sign * (requested[resource] ?? 0));
    publish({ site: scope.site, kind: "resource", state: scope.state, remainingWorkMs: scope.remainingWorkMs,
      snapshotRestoreInProgress, operation: scope.operation, status, ownerArgument: scope.owner ?? null,
      configuredCostType, requiredWorkMs, configuredCost, requested, refundFactor: scope.refundFactor,
      before, after, callbackAmounts: current.callbackAmounts, callbackCount: current.callbackCount,
      nestedEmission: current.nested, balanceMatches });
  };
}
