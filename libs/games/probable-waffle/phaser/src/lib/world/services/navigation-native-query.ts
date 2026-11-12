import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { NavigationNativeBoundary } from "./navigation-native-boundary";

/** Exact native lookup and cache insertion lineage. Provenance observes route ownership without changing it. */
export interface NavigationNativeQuery {
  /** Scene-local bounded identity, shared by ground, occupancy overlays and water. */
  readonly queryId: number;
  readonly engine: "ground_static" | "ground_overlay" | "water_static";
  readonly from: Vector2Simple;
  readonly to: Vector2Simple;
  readonly cache: "hit" | "miss" | "bypass";
  /** Native performance.now sample at cache lookup; overlays do not sample wall time. */
  readonly requestTimeMs: number | null;
  readonly requested: NavigationNativeBoundary | null;
  /** Written at the actual cache insertion or overlay callback, before resolving the original Promise. */
  completed: NavigationNativeBoundary | null;
  readonly entry: {
    readonly queryId: number;
    readonly requestTimeMs: number;
    readonly requested: NavigationNativeBoundary | null;
    readonly stored: NavigationNativeBoundary | null;
  } | null;
}
