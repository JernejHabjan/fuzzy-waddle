import type Phaser from "phaser";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { getActorComponent } from "../../../data/actor-component";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import { PawnOrderObservation } from "../../../prefabs/ai-agents/pawn-order-observation";
import { PRODUCTION_SPATIAL_AUTHORITY_EVENT } from "../../../world/services/multiplayer/production-spatial-authority-event";

/** Scope only the already-selected synchronous action. Unstamped rally orders never acquire a fabricated command. */
export function observeProductionRallyAction<T>(producer: Phaser.GameObjects.GameObject,
  item: UnifiedQueueItem | undefined, product: Phaser.GameObjects.GameObject, call: () => T): T {
  let board: PawnAiController["blackboard"] | undefined;
  try {
    if (item && producer.scene.events.listenerCount(PRODUCTION_SPATIAL_AUTHORITY_EVENT)) {
      board = getActorComponent(product, PawnAiController)?.blackboard;
    }
  } catch { /* Failed diagnostic reads preserve the native action. */ }
  return board && item ? PawnOrderObservation.rally(board, producer, item, call) : call();
}
