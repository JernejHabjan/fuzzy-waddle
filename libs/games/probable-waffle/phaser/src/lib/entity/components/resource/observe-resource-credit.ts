import type Phaser from "phaser";
import type { Subscription } from "rxjs";
import { ResourceType, type PlayerStateResources } from "@fuzzy-waddle/probable-waffle-protocol";
import { getCommunicator, getPlayer, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { sampleQueueResourceBalance, sampleQueueResourceVector } from "../../../data/queue-resource-samples";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { ResourceServiceObservation } from "./resource-service-observation";
import type { ResourceServiceEvent } from "./resource-service-event";
import { observeResourceApplication } from "./observe-resource-application";

const active = new WeakMap<Phaser.Scene, { interference: boolean }>();

/** One exact synchronous native emission/application interval; identical amounts from another event are insufficient. */
export function observeResourceCredit(scope: Pick<Extract<ResourceServiceEvent, { kind: "resource_credit" }>,
  "actor" | "target" | "context" | "resourceType" | "amount" | "channel" | "ownerArgument">,
  scene: Phaser.Scene, amounts: Partial<PlayerStateResources>, emit?: () => void): void {
  if (!ResourceServiceObservation.observed(scope.actor)) { emit?.(); return; }
  let finish: ((status: "returned" | "threw" | "campaign_suppressed") => void) | undefined;
  try { finish = prepare(scope, scene, amounts); } catch { /* Readers cannot prevent native emission. */ }
  let status: "returned" | "threw" | "campaign_suppressed" = emit ? "threw" : "campaign_suppressed";
  try { if (emit) { emit(); status = "returned"; } }
  finally { try { finish?.(status); } catch { /* Cleanup/projection cannot replace native return or error. */ } }
}

/** All observation setup is isolated from native policy; missing samples stay missing rather than using prior balances. */
function prepare(scope: Parameters<typeof observeResourceCredit>[0], scene: Phaser.Scene,
  amounts: Partial<PlayerStateResources>) {
  let beneficiary: number | null = null, restore: boolean | null = null;
  try { beneficiary = scope.ownerArgument ?? (scene as ProbableWaffleScene).player?.playerNumber ?? null; } catch { /* Missing. */ }
  try { restore = isSnapshotApplyInProgress(scene); } catch { /* Missing restore authority. */ }
  const balance = () => {
    try { return beneficiary === null ? null : sampleQueueResourceBalance(scene, beneficiary); } catch { return null; }
  };
  const before = balance(), requested = sampleQueueResourceVector(amounts);
  const current = { interference: false, count: 0, amounts: null as Partial<Record<ResourceType, number>> | null };
  const parent = active.get(scene);
  if (parent) parent.interference = true;
  active.set(scene, current);
  let subscription: Subscription | undefined;
  let application: (() => object | undefined) | undefined;
  try {
    application = observeResourceApplication(beneficiary === null ? undefined : getPlayer(scene, beneficiary), amounts);
    subscription = getCommunicator(scene).playerChanged?.on.subscribe((event) => {
      try {
        if (active.get(scene) !== current) return;
        if (event.property !== "resource.added" && event.property !== "resource.removed") return;
        if (event.property !== "resource.added" || event.data.playerNumber !== beneficiary ||
          event.data.playerStateData?.resources !== amounts) { current.interference = true; return; }
        current.count = Math.min(9, current.count + 1);
        current.amounts = sampleQueueResourceVector(event.data.playerStateData.resources);
      } catch { current.interference = true; }
    });
  } catch { /* Missing exact callback keeps application unavailable. */ }
  return (status: "returned" | "threw" | "campaign_suppressed") => {
    let operation: object | undefined;
    try { operation = application?.(); subscription?.unsubscribe(); }
    finally { if (parent) active.set(scene, parent); else active.delete(scene); }
    const after = balance(), observed = current.amounts;
    const balanceMatches = status === "returned" && restore === false && !current.interference && current.count === 1 &&
      before !== null && after !== null && requested !== null && observed !== null && Object.values(ResourceType).every((type) =>
        (requested[type] ?? 0) === (observed[type] ?? 0) && after[type] === before[type] + (requested[type] ?? 0));
    ResourceServiceObservation.publish({ ...scope, kind: "resource_credit", beneficiary, status, before, after,
      application: !current.interference && status === "returned" ? operation : undefined,
      callbackAmounts: observed, callbackCount: current.count, interference: current.interference,
      snapshotRestoreInProgress: restore, balanceMatches });
  };
}
