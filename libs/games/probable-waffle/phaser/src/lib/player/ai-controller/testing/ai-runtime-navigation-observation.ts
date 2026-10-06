import type Phaser from "phaser";
import { NavigationService } from "../../../world/services/navigation.service";
import type { HeightNavigationGraph } from "../../../world/services/height-navigation-graph-builder";
import type { AiRuntimeNavigationBoundaryV1 } from "./ai-runtime-navigation-boundary-v1";

/** Marked-test observer. Reads graph identity only; no tiles, actors, path queries, timers or planner input escape. */
export class AiRuntimeNavigationObservation {
  private previousGraph?: HeightNavigationGraph;
  private graphObservationId = 0;
  private updateRequestCount = 0;
  private lost = false;
  private disposed = false;
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
    return { graphObservationId: graph ? this.graphObservationId : null, updateRequestCount: this.updateRequestCount };
  }

  /** Removes our sole listener and releases the graph reference; pending caller queries remain native-owned. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.events.off(NavigationService.UpdateNavigationEvent, this.onUpdateRequested, this);
    this.previousGraph = undefined;
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
