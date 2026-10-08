import type Phaser from "phaser";
import type { OrderData } from "../../ai/OrderData";
import type { PawnAiBlackboard } from "./pawn-ai-blackboard";
import type { PawnResourceServiceEvent } from "./pawn-resource-service-event";

/** Passive native attempt boundaries. No ambient ownership crosses awaits; original Promise/error is forwarded exactly. */
export class PawnResourceServiceObservation {
  private static readonly observers = new WeakMap<PawnAiBlackboard, Set<(event: PawnResourceServiceEvent) => void>>();

  static subscribe(board: PawnAiBlackboard, observer: (event: PawnResourceServiceEvent) => void): () => void {
    const listeners = this.observers.get(board) ?? new Set();
    if (listeners.size >= 8) return () => undefined;
    listeners.add(observer); this.observers.set(board, listeners);
    return () => { listeners.delete(observer); if (!listeners.size) this.observers.delete(board); };
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
        try { listener({ execution, actor, board, order, target, operation, phase, amount }); }
        catch { /* Diagnostics cannot replace native work or the caller's result. */ }
      });
    };
    emit("started", null);
    let result: Promise<number>;
    try { result = call(execution); }
    catch (error) { emit("threw", null); throw error; }
    // This side observation adds no await or replacement Promise. Unsubscribed listeners cannot receive late terminals.
    try { void result.then((amount) => emit("resolved", amount), () => emit("rejected", null)); }
    catch { /* A lost diagnostic subscription does not alter the native return. */ }
    return result;
  }
}
