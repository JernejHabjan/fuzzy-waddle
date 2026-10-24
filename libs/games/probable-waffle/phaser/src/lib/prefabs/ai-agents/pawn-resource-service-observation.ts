import type Phaser from "phaser";
import type { OrderData } from "../../ai/OrderData";
import type { PawnAiBlackboard } from "./pawn-ai-blackboard";
import type { PawnResourceServiceEvent } from "./pawn-resource-service-event";

/** Passive native attempt boundaries. No ambient ownership crosses awaits; original Promise/error is forwarded exactly. */
export class PawnResourceServiceObservation {
  private static readonly observers = new WeakMap<PawnAiBlackboard,
    Set<{ event: (event: PawnResourceServiceEvent) => void; loss?: (reason: string) => void }>>();

  static subscribe(board: PawnAiBlackboard, observer: (event: PawnResourceServiceEvent) => void,
    loss?: (reason: string) => void): () => void {
    const listeners = this.observers.get(board) ??
      new Set<{ event: (event: PawnResourceServiceEvent) => void; loss?: (reason: string) => void }>();
    if (listeners.size >= 8) { this.reportLoss(loss, "service_subscription_overflow"); return () => undefined; }
    const listener = { event: observer, loss };
    listeners.add(listener); this.observers.set(board, listeners);
    return () => { if (!listeners.has(listener)) return;
      this.reportLoss(loss, "service_unsubscribed");
      listeners.delete(listener); if (!listeners.size) this.observers.delete(board); };
  }

  /** The callee is invoked once with the caller's already-selected target; no fresh order/component read is added. */
  static invoke(actor: Phaser.GameObjects.GameObject, board: PawnAiBlackboard, order: OrderData,
    target: Phaser.GameObjects.GameObject, operation: PawnResourceServiceEvent["operation"],
    call: (execution?: object) => Promise<number>): Promise<number> {
    const listeners = this.observers.get(board);
    if (!listeners?.size) return call();
    const execution = {};
    const emit = (phase: PawnResourceServiceEvent["phase"], amount: number | null) => {
      listeners.forEach((listener) => {
        try { listener.event({ execution, actor, board, order, target, operation, phase, amount }); }
        catch { this.reportLoss(listener.loss, "service_listener_failed"); }
      });
    };
    emit("started", null);
    let result: Promise<number>;
    try { result = call(execution); }
    catch (error) { emit("threw", null); throw error; }
    // This side observation adds no await or replacement Promise. Unsubscribed listeners cannot receive late terminals.
    try { void result.then((amount) => emit("resolved", amount), () => emit("rejected", null)); }
    catch { listeners.forEach((listener) => this.reportLoss(listener.loss, "service_terminal_subscription_failed")); }
    return result;
  }

  private static reportLoss(loss: ((reason: string) => void) | undefined, reason: string): void {
    try { loss?.(reason); } catch { /* Preserve the native Promise/error. */ }
  }
}
