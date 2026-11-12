import type Phaser from "phaser";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { PRODUCTION_SPATIAL_AUTHORITY_EVENT, type ProductionSpatialAuthorityEvent } from
  "../../../world/services/multiplayer/production-spatial-authority-event";

/**
 * Observe the already selected native branch. No listener means no extra actor/target reads;
 * failures cannot alter rally execution.
 */
export function observeProductionOutput(
  producer: Phaser.GameObjects.GameObject, item: UnifiedQueueItem | undefined, product: Phaser.GameObjects.GameObject,
  rallyMode: Extract<ProductionSpatialAuthorityEvent, { kind: "output" }>["rallyMode"],
  target: Phaser.GameObjects.GameObject | null = null, targetTile: Vector3Simple | null = null
): void {
  if (!item) return;
  try {
    if (producer.scene.events.listenerCount(PRODUCTION_SPATIAL_AUTHORITY_EVENT)) {
      producer.scene.events.emit(PRODUCTION_SPATIAL_AUTHORITY_EVENT, {
        kind: "output", producer, item, product, rallyMode, target, targetTile
      } satisfies ProductionSpatialAuthorityEvent);
    }
  } catch { /* Local diagnostics cannot replace the native selected action or its errors. */ }
}
