import type { Page } from "@playwright/test";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { ActorIndexSystem } from "@fuzzy-waddle/probable-waffle-phaser/world/services/ActorIndexSystem";
import type { SimulationTickService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/simulation-tick.service";
import type { NavigationService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/navigation.service";
import type { ProductionComponent } from
  "@fuzzy-waddle/probable-waffle-phaser/entity/components/production/production-component";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";

/** Retain original native objects, paid handles and a genuine pending query in the app realm across ordinary UI disposal. */
export async function retainNativeSceneWork(
  page: Page, playerNumber: number, requirePaidQueue: boolean, pathActorId?: string
) {
  return page.evaluate(async ({ playerNumber, requirePaidQueue, pathActorId }) => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __fuzzyWaddleAiMultiplayerBrowserTestV1?: Pick<AiRuntimeBrowserTestHostV1, "game">;
      __nativeRetainedWork?: () => Promise<{ oldSceneInactive: boolean; oldTickObservers: number;
        originalPaidCommandId: string | null; completionResults: (string | null)[];
        pathWasPending: boolean; pathCancelled: boolean; sameRealm: boolean }> };
    const host = realm.__fuzzyWaddleAiRuntimeBrowserTestV1 ?? realm.__fuzzyWaddleAiMultiplayerBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      ProbableWaffleScene | undefined;
    if (!scene) throw new Error("retained_native_scene_missing");
    const services: readonly object[] = scene.getSceneGameData().services;
    const index = services.find((entry): entry is ActorIndexSystem => "getOwnedActors" in entry && "getActorById" in entry);
    const clock = services.find((entry): entry is SimulationTickService => "currentTick" in entry && "tick$" in entry);
    const navigation = services.find((entry): entry is NavigationService => "findPathFromGameObjectToTile" in entry);
    if (!index || !clock) throw new Error("retained_native_owners_missing");
    let production: ProductionComponent | undefined, item: UnifiedQueueItem | undefined;
    for (const actor of index.getOwnedActors(playerNumber)) {
      const components = actor.getData("actorData")?.components as Map<unknown, object> | undefined;
      const values = [...(components?.values() ?? [])];
      const queue = values.find((entry): entry is { allItems: UnifiedQueueItem[] } => "allItems" in entry);
      const candidate = values.find((entry): entry is ProductionComponent => "handleProductionComplete" in entry);
      const paid = queue?.allItems.find((entry) => !!entry.productionData && !!entry.commandContext && entry.remainingTime > 0);
      if (candidate && paid) { production = candidate; item = paid; break; }
    }
    if (requirePaidQueue && (!production || !item?.productionData)) throw new Error("retained_original_paid_queue_missing");
    let pathSettled = false;
    const actor = pathActorId ? index.getActorById(pathActorId) : undefined;
    if (pathActorId && (!actor || !navigation)) throw new Error("retained_original_path_owner_missing");
    const pending = actor && navigation ? navigation.findPathFromGameObjectToTile(actor, { x: 19, y: 27 })
      .then((result) => { pathSettled = true; return result; }) : null;
    await Promise.resolve();
    const pathWasPending = !!pending && !pathSettled;
    if (pathActorId && !pathWasPending) throw new Error("retained_native_query_not_pending");
    const originalPaidCommandId = item?.commandContext?.execution.commandId ?? null;
    realm.__nativeRetainedWork = async () => {
      const completionResults: (string | null)[] = [];
      if (production && item?.productionData) for (let attempt = 0; attempt < 2; attempt++)
        completionResults.push(production.handleProductionComplete(item.productionData, item));
      const path = pending ? await pending : undefined;
      // Redeliver through the actual old emitter. Shutdown must have removed every original subscriber.
      clock.tick$.next(clock.currentTick + 1);
      const result = { oldSceneInactive: !scene.sys.isActive(), oldTickObservers: clock.tick$.observers.length,
        originalPaidCommandId, completionResults, pathWasPending, pathCancelled: pending !== null && path === null,
        sameRealm: true };
      delete realm.__nativeRetainedWork;
      return result;
    };
    return { originalPaidCommandId, pathWasPending };
  }, { playerNumber, requirePaidQueue, pathActorId });
}

export async function deliverRetainedNativeSceneWork(page: Page) {
  return page.evaluate(async () => {
    const realm = window as unknown as { __nativeRetainedWork?: () => Promise<{
      oldSceneInactive: boolean; oldTickObservers: number; originalPaidCommandId: string | null;
      completionResults: (string | null)[]; pathWasPending: boolean; pathCancelled: boolean; sameRealm: boolean }> };
    if (!realm.__nativeRetainedWork) throw new Error("retained_native_work_missing_after_transition");
    return realm.__nativeRetainedWork();
  });
}
