import type Phaser from "phaser";
import type { OrderData } from "../../ai/OrderData";
import type { PawnAiBlackboard } from "../../prefabs/ai-agents/pawn-ai-blackboard";
import type { MovementQueryContext } from "./movement-query-context";

/** Passive local observation. Only the actual synchronous navigation invocation has an ambient binding. */
export class MovementQueryObservation {
  private static readonly observers = new WeakMap<PawnAiBlackboard, Set<(context: MovementQueryContext) => void>>();
  private static readonly active = new WeakMap<Phaser.GameObjects.GameObject,
    { context: MovementQueryContext | undefined; stage: "initial" | "repath" | "fallback"; depth: number }>();

  static subscribe(board: PawnAiBlackboard, observer: (context: MovementQueryContext) => void): () => void {
    const listeners = this.observers.get(board) ?? new Set();
    if (listeners.size >= 8) return () => undefined;
    listeners.add(observer); this.observers.set(board, listeners);
    return () => { listeners.delete(observer); if (!listeners.size) this.observers.delete(board); };
  }

  /** Snapshot the order actually selected by the caller, without rereading the blackboard. */
  static capture(actor: Phaser.GameObjects.GameObject, board: PawnAiBlackboard, order: OrderData | null,
    caller: MovementQueryContext["caller"]): MovementQueryContext | undefined {
    const listeners = this.observers.get(board);
    if (!listeners?.size) return undefined;
    const context: MovementQueryContext = { actor, board, order, caller };
    listeners.forEach((listener) => { try { listener(context); } catch { /* Preserve native order use. */ } });
    return context;
  }

  /** Ends before any Promise settles. Undefined/nested calls shadow earlier context instead of borrowing it. */
  static invoke<T>(actor: Phaser.GameObjects.GameObject, context: MovementQueryContext | undefined,
    stage: "initial" | "repath" | "fallback", call: () => T): T {
    const previous = this.active.get(actor);
    if (!context && !previous) return call();
    const depth = Math.min(9, (previous?.depth ?? 0) + 1);
    this.active.set(actor, { context: depth <= 8 && context?.actor === actor ? context : undefined, stage, depth });
    try { return call(); }
    finally { if (previous) this.active.set(actor, previous); else this.active.delete(actor); }
  }

  static current(actor: Phaser.GameObjects.GameObject):
    { context: MovementQueryContext; stage: "initial" | "repath" | "fallback" } | undefined {
    const active = this.active.get(actor);
    return active?.context ? { context: active.context, stage: active.stage } : undefined;
  }

  /** Only the outer marked navigation wrapper can claim a native invocation; nested/reentrant queries stay missing. */
  static take(actor: Phaser.GameObjects.GameObject): ReturnType<typeof MovementQueryObservation.current> {
    const value = this.current(actor), active = this.active.get(actor);
    if (active) active.context = undefined;
    return value;
  }
}
