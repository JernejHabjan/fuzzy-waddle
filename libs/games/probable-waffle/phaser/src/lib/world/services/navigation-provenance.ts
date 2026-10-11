import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { NavigationNativeBoundary } from "./navigation-native-boundary";
import type { NavigationNativeQuery } from "./navigation-native-query";

/** Bounded O(1) native provenance. Observer scopes exist only during an existing synchronous query invocation. */
export class NavigationProvenance {
  private state: NavigationNativeBoundary = { completedRebuild: 0, rebuildInProgress: false,
    groundConfiguration: 0, waterConfiguration: 0, groundCacheClear: 0, waterCacheClear: 0 };
  private nextQueryId = 1;
  private rebuildDepth = 0;
  private lost = false;
  private observers: readonly ((query: NavigationNativeQuery) => void)[] = [];

  sample(): NavigationNativeBoundary | null {
    return this.lost ? null : { ...this.state };
  }

  beginRebuild(): void {
    if (this.rebuildDepth === 8) this.lost = true;
    else this.rebuildDepth++;
    this.state = { ...this.state, rebuildInProgress: true };
  }

  completeRebuild(): void {
    this.increment("completedRebuild");
    this.rebuildDepth = Math.max(0, this.rebuildDepth - 1);
    this.state = { ...this.state, rebuildInProgress: this.rebuildDepth > 0 };
  }

  /** Release a failed invocation while keeping partial configuration unavailable until a later successful rebuild. */
  failedRebuild(): void {
    this.rebuildDepth = Math.max(0, this.rebuildDepth - 1);
    this.state = { ...this.state, rebuildInProgress: true };
  }

  configured(engine: "ground" | "water"): void {
    this.increment(engine === "ground" ? "groundConfiguration" : "waterConfiguration");
  }

  cleared(engine: "ground" | "water"): void {
    this.increment(engine === "ground" ? "groundCacheClear" : "waterCacheClear");
  }

  /** Restores the prior scope even on a native throw; diagnostic exceptions cannot invoke or replace the native call. */
  observe<T>(call: () => T, observer: (query: NavigationNativeQuery) => void): T {
    if (this.observers.length >= 8) { this.lost = true; return call(); }
    const previous = this.observers;
    this.observers = [...previous, observer];
    try { return call(); }
    finally { this.observers = previous; }
  }

  /** Cache hits flatten the original insertion lineage, avoiding chains and retaining old-callback provenance. */
  query(
    engine: NavigationNativeQuery["engine"], from: Vector2Simple, to: Vector2Simple,
    cache: NavigationNativeQuery["cache"], now: number | null, cached?: NavigationNativeQuery | null
  ): NavigationNativeQuery | null {
    if (this.lost || this.nextQueryId > 8192) { this.lost = true; return null; }
    try {
      const query: NavigationNativeQuery = { queryId: this.nextQueryId++, engine,
        from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y },
        cache, requestTimeMs: now, requested: this.sample(), completed: null,
        entry: cached && cached.requestTimeMs !== null ? { queryId: cached.queryId, requestTimeMs: cached.requestTimeMs,
          requested: cached.requested, stored: cached.completed } : null };
      for (const observer of this.observers) {
        try { observer(query); } catch { /* Diagnostic loss cannot affect native cache lookup or callback ordering. */ }
      }
      return query;
    } catch {
      this.lost = true;
      return null;
    }
  }

  completed(query: NavigationNativeQuery | null): void {
    try { if (query) query.completed = this.sample(); }
    catch { this.lost = true; }
  }

  private increment(key: Exclude<keyof NavigationNativeBoundary, "rebuildInProgress">): void {
    if (this.state[key] === 8192) this.lost = true;
    else this.state = { ...this.state, [key]: this.state[key] + 1 };
  }
}
