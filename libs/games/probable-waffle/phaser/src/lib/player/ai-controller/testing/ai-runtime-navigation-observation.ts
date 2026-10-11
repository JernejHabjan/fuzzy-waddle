import type Phaser from "phaser";
import { NavigationService } from "../../../world/services/navigation.service";
import type { HeightNavigationGraph } from "../../../world/services/height-navigation-graph-builder";
import type { AiRuntimeNavigationBoundaryV1 } from "./ai-runtime-navigation-boundary-v1";
import { AiRuntimeNativeQueryObservation } from "./ai-runtime-native-query-observation";

/** Marked-test owner of graph identity, native milestones and scoped existing lookups; no extra world queries or timers. */
export class AiRuntimeNavigationObservation {
  private previousGraph?: HeightNavigationGraph;
  private graphObservationId = 0;
  private updateRequestCount = 0;
  private lost = false;
  private nativeLost = false;
  private disposed = false;
  private readonly queries = new Set<AiRuntimeNativeQueryObservation>();
  private static readonly OBSERVATION_LIMIT = 8192;

  constructor(private readonly scene: Phaser.Scene, private readonly navigation: NavigationService) {
    scene.events.on(NavigationService.UpdateNavigationEvent, this.onUpdateRequested, this);
  }

  /** O(1) sample of the existing graph reference. An unavailable graph breaks the consecutive-reference interval. */
  sample(): AiRuntimeNavigationBoundaryV1 {
    if (this.disposed || this.lost) return { graphObservationId: null, updateRequestCount: null };
    let graph: HeightNavigationGraph | undefined;
    try {
      graph = this.navigation.getHeightGraphDebugSnapshot();
    } catch {
      this.lost = true;
      this.previousGraph = undefined;
      return { graphObservationId: null, updateRequestCount: null };
    }
    if (graph && graph !== this.previousGraph) {
      if (this.graphObservationId === AiRuntimeNavigationObservation.OBSERVATION_LIMIT) {
        this.lost = true;
        this.previousGraph = undefined;
        return { graphObservationId: null, updateRequestCount: null };
      }
      this.graphObservationId++;
    }
    this.previousGraph = graph;
    let native: AiRuntimeNavigationBoundaryV1["native"];
    try { native = this.nativeLost ? null : this.navigation.getNativeNavigationBoundary?.(); }
    catch { native = null; }
    if (native === null) this.nativeLost = true;
    return { graphObservationId: graph ? this.graphObservationId : null, updateRequestCount: this.updateRequestCount, native };
  }

  /** At most 256 pending caller bindings; loss does not suppress or retry the native query. */
  query(): AiRuntimeNativeQueryObservation {
    const query = new AiRuntimeNativeQueryObservation(!this.disposed && this.queries.size < 256 ? this.navigation : undefined);
    if (!this.disposed && this.queries.size < 256) this.queries.add(query);
    return query;
  }

  release(query: AiRuntimeNativeQueryObservation | undefined): void {
    if (!query) return;
    query.dispose();
    this.queries.delete(query);
  }

  /** Removes our sole listener and releases the graph reference; pending caller queries remain native-owned. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.events.off(NavigationService.UpdateNavigationEvent, this.onUpdateRequested, this);
    this.previousGraph = undefined;
    this.queries.forEach((query) => query.dispose());
    this.queries.clear();
  }

  private readonly onUpdateRequested = (): void => {
    if (this.disposed || this.lost) return;
    if (this.updateRequestCount === AiRuntimeNavigationObservation.OBSERVATION_LIMIT) {
      this.lost = true;
      this.previousGraph = undefined;
    } else {
      this.updateRequestCount++;
    }
  };
}
