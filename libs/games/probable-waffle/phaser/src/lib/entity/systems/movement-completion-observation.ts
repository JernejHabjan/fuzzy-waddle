import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { PawnAiBlackboard } from "../../prefabs/ai-agents/pawn-ai-blackboard";
import { getGameObjectCurrentTile } from "../../data/game-object-helper";
import type { MovementQueryContext } from "./movement-query-context";
import type { MovementCompletionEvent } from "./movement-completion-event";

/** Listener-free execution creates no token or extra position read. Explicit tokens survive awaits and recursion. */
export class MovementCompletionObservation {
  private static readonly observers = new WeakMap<PawnAiBlackboard, Set<(event: MovementCompletionEvent) => void>>();
  private originalDestination: Vector2Simple | null;
  private selectedDestination: Vector2Simple | null = null;
  private fallback = false;
  private physicalTerminal = false;

  private constructor(private readonly context: MovementQueryContext, private readonly mode: MovementCompletionEvent["mode"],
    destination: Vector2Simple | undefined) {
    this.originalDestination = destination ? { x: destination.x, y: destination.y } : null;
  }

  static subscribe(board: PawnAiBlackboard, observer: (event: MovementCompletionEvent) => void): () => void {
    const listeners = this.observers.get(board) ?? new Set();
    if (listeners.size >= 8) return () => undefined;
    listeners.add(observer); this.observers.set(board, listeners);
    return () => { listeners.delete(observer); if (!listeners.size) this.observers.delete(board); };
  }

  static begin(context: MovementQueryContext | undefined, mode: MovementCompletionEvent["mode"],
    destination?: Vector2Simple): MovementCompletionObservation | undefined {
    if (!context || !this.observers.get(context.board)?.size) return undefined;
    try {
      const token = new MovementCompletionObservation(context, mode, destination);
      token.emit("started"); return token;
    } catch { return undefined; }
  }

  /** Called only when a native route will be executed; fallback reachability probes never select an endpoint. */
  destination(tile: Vector2Simple | undefined, fallback = false): void {
    try {
      if (!tile || this.physicalTerminal) return;
      this.selectedDestination = { x: tile.x, y: tile.y };
      this.originalDestination ??= { ...this.selectedDestination };
      this.fallback ||= fallback;
      this.emit("destination");
    } catch { /* Diagnostics cannot interrupt movement. */ }
  }

  /** Arrival precedes native user callbacks; a callback error cannot erase the already observed physical boundary. */
  terminal(phase: "arrived" | "stopped"): void {
    if (this.physicalTerminal) return;
    this.physicalTerminal = true; this.emit(phase);
  }

  returned(result: boolean): void { this.emit(result ? "returned_true" : "returned_false"); }
  threw(): void { this.emit("threw"); }

  private emit(phase: MovementCompletionEvent["phase"]): void {
    const listeners = MovementCompletionObservation.observers.get(this.context.board);
    if (!listeners?.size) return;
    try {
      const tile = getGameObjectCurrentTile(this.context.actor);
      listeners.forEach((listener) => {
        try {
          listener({ context: this.context, execution: this, phase, mode: this.mode,
            originalDestination: this.originalDestination ? { ...this.originalDestination } : null,
            selectedDestination: this.selectedDestination ? { ...this.selectedDestination } : null,
            fallback: this.fallback, actualTile: tile ? { x: tile.x, y: tile.y } : null });
        } catch { /* Preserve exact native callbacks, errors and return values. */ }
      });
    } catch { /* Missing position remains missing observation. */ }
  }
}
