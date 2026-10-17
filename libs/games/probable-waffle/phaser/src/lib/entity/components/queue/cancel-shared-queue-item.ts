import type Phaser from "phaser";
import type { SharedQueue } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/shared-queue";
import {
  QueueItemType,
  type UnifiedQueueItem
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { ProductionQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/game-object";
import type { CancelProductionCommand, CancelResearchCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProductionComponent } from "../production/production-component";
import { ResearchComponent } from "../research/research-component";
import { mutateSharedQueueItem } from "./mutate-shared-queue-item";

/** Keeps native refund/terminal/UI order while cancelling the exact addressed paid handle, never a same-name neighbour. */
export class SharedQueueCancellation {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly sharedQueues: readonly SharedQueue[],
    private readonly productionComponent: ProductionComponent | undefined,
    private readonly researchComponent: ResearchComponent | undefined,
    private readonly reportTerminalOutcome: (
      item: UnifiedQueueItem,
      kind: "cancelled",
      links: string[],
      detail: string
    ) => void,
    private readonly notifyQueueChanged: () => void
  ) {}
  private get allItems() {
    return this.sharedQueues.flatMap((queue) => queue.queuedItems);
  }

  cancelProductionItem(item: ProductionQueueItem, cancellationCommand?: CancelProductionCommand): boolean {
    for (let i = 0; i < this.sharedQueues.length; i++) {
      const queue = this.sharedQueues[i]!;
      const index = queue.queuedItems.findIndex(
        (queueItem) => queueItem.type === QueueItemType.Production && queueItem.productionData === item
      );

      if (index !== -1) {
        const cancelledItem = queue.queuedItems[index]!;
        if (cancelledItem.type !== QueueItemType.Production || !cancelledItem.productionData) {
          continue;
        }

        // Remove from queue
        mutateSharedQueueItem(
          {
            producer: this.gameObject,
            item: cancelledItem,
            queueIndex: i,
            itemIndex: index,
            operation: "cancel_remove",
            cancellationCommand
          },
          () => {
            queue.queuedItems.splice(index, 1);
          }
        );
        this.reportTerminalOutcome(cancelledItem, "cancelled", [], "queue_item_cancelled");

        // Delegate refund to ProductionComponent
        if (this.productionComponent) {
          this.productionComponent.handleProductionRefund(
            cancelledItem.productionData.costData,
            cancelledItem,
            cancellationCommand
          );
          this.productionComponent.emitQueueChange({
            itemsFromAllQueues: this.allItems,
            type: "remove"
          });

          // Reset progress if queue is empty
          if (queue.queuedItems.length === 0) {
            this.productionComponent.emitProductionProgress({
              queueIndex: i,
              queueItemIndex: 0,
              progressInPercentage: 0
            });
          }
        }

        this.notifyQueueChanged();
        return true;
      }
    }
    return false;
  }

  /**
   * Public API: Cancel the first research item
   */
  cancelResearchItem(cancellationCommand?: CancelResearchCommand): boolean {
    for (const [queueIndex, queue] of this.sharedQueues.entries()) {
      const firstItem = queue.queuedItems[0];
      if (firstItem && firstItem.type === QueueItemType.Research && firstItem.researchData) {
        const type = firstItem.researchData;

        // Delegate refund to ResearchComponent
        if (this.researchComponent) {
          this.researchComponent.handleResearchRefund(
            type,
            firstItem.remainingTime,
            firstItem.totalTime,
            firstItem,
            cancellationCommand
          );
        }

        // Remove from queue
        mutateSharedQueueItem(
          {
            producer: this.gameObject,
            item: firstItem,
            queueIndex,
            itemIndex: 0,
            operation: "cancel_remove",
            cancellationCommand
          },
          () => {
            queue.queuedItems.splice(0, 1);
          }
        );
        this.reportTerminalOutcome(firstItem, "cancelled", [], "research_cancelled");

        // Emit cancellation
        if (this.researchComponent) {
          this.researchComponent.researchCancelled.emit(type);
          this.gameObject.emit(ResearchComponent.ResearchCancelledEvent, type);
        }

        // Emit queue change
        if (this.productionComponent) {
          this.productionComponent.emitQueueChange({
            itemsFromAllQueues: this.allItems,
            type: "remove"
          });
        }

        this.notifyQueueChanged();
        return true;
      }
    }
    return false;
  }
}
