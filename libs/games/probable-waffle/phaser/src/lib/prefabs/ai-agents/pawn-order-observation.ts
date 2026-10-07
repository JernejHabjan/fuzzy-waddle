import type Phaser from "phaser";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { OrderData } from "../../ai/OrderData";
import type { PawnAiBlackboard } from "./pawn-ai-blackboard";

/** Local diagnostic subscribers and synchronous rally origins; none are game, save or relay state. */
export class PawnOrderObservation {
  private static readonly observers = new WeakMap<PawnAiBlackboard,
    Set<(order: OrderData, origin: { producer: Phaser.GameObjects.GameObject; item: UnifiedQueueItem } | undefined) => void>>();
  private static readonly origins = new WeakMap<PawnAiBlackboard,
    { producer: Phaser.GameObjects.GameObject; item: UnifiedQueueItem; depth: number; orders: OrderData[] }>();

  static subscribe(board: PawnAiBlackboard, observer: (order: OrderData,
    origin: { producer: Phaser.GameObjects.GameObject; item: UnifiedQueueItem } | undefined) => void): () => void {
    const observers = this.observers.get(board) ?? new Set();
    if (observers.size >= 8) return () => undefined;
    observers.add(observer); this.observers.set(board, observers);
    return () => { observers.delete(observer); if (!observers.size) this.observers.delete(board); };
  }

  /** Called only after the native enqueue succeeds; observer exceptions never replace native behavior. */
  static enqueued(board: PawnAiBlackboard, order: OrderData): void {
    const origin = this.origins.get(board);
    if (origin && origin.depth <= 8 && origin.orders.length < 2) origin.orders.push(order);
    this.observers.get(board)?.forEach((observer) => {
      try { observer(order, undefined); } catch { /* Lost diagnostics remain missing. */ }
    });
  }

  /** Bounds nested observation while invoking the original action once with its original return/error. */
  static rally<T>(board: PawnAiBlackboard, producer: Phaser.GameObjects.GameObject, item: UnifiedQueueItem,
    call: () => T): T {
    if (!this.observers.has(board)) return call();
    const previous = this.origins.get(board);
    const depth = Math.min(9, (previous?.depth ?? 0) + 1);
    const origin = { producer, item, depth, orders: [] as OrderData[] };
    this.origins.set(board, origin);
    try { return call(); }
    finally {
      if (previous) this.origins.set(board, previous);
      else this.origins.delete(board);
      // A nested cancellation can enqueue other orders. Ambiguous scopes cannot attribute any of them to rally.
      if (depth <= 8 && origin.orders.length === 1) {
        this.observers.get(board)?.forEach((observer) => {
          try { observer(origin.orders[0], origin); } catch { /* Preserve the original action result/error. */ }
        });
      }
    }
  }
}
