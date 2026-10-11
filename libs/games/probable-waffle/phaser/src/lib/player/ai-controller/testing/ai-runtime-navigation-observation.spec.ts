import Phaser from "phaser";
import { NavigationService } from "../../../world/services/navigation.service";
import type { HeightNavigationGraph } from "../../../world/services/height-navigation-graph-builder";
import { AiRuntimeNavigationObservation } from "./ai-runtime-navigation-observation";

/** Synthetic identity/update-request seam; this is not path freshness or a running topology proof. */
function fixture() {
  const scene = { events: new Phaser.Events.EventEmitter() } as unknown as Phaser.Scene;
  let graph: HeightNavigationGraph | undefined = { cells: [], edgesByTileKey: new Map() };
  const readGraph = jest.fn(() => graph);
  const navigation = { getHeightGraphDebugSnapshot: readGraph } as unknown as NavigationService;
  const observer = new AiRuntimeNavigationObservation(scene, navigation);
  return { scene, observer, readGraph, replace: (value: HeightNavigationGraph | undefined) => { graph = value; } };
}

describe("capture-local navigation observation", () => {
  it("tracks consecutive graph observations separately from update requests and releases its listener", () => {
    const f = fixture();
    expect(f.readGraph).not.toHaveBeenCalled();
    expect(f.observer.sample()).toEqual({ graphObservationId: 1, updateRequestCount: 0 });
    f.scene.events.emit(NavigationService.UpdateNavigationEvent);
    f.scene.events.emit(NavigationService.UpdateNavigationEvent);
    expect(f.observer.sample()).toEqual({ graphObservationId: 1, updateRequestCount: 2 });
    f.replace({ cells: [], edgesByTileKey: new Map() });
    expect(f.observer.sample()).toEqual({ graphObservationId: 2, updateRequestCount: 2 });
    f.observer.dispose(); f.observer.dispose();
    f.scene.events.emit(NavigationService.UpdateNavigationEvent);
    expect(f.scene.events.listenerCount(NavigationService.UpdateNavigationEvent)).toBe(0);
    expect(f.observer.sample()).toEqual({ graphObservationId: null, updateRequestCount: null });
    expect(f.readGraph).toHaveBeenCalledTimes(3);
  });

  it("breaks the observed reference interval when the graph is unavailable", () => {
    const f = fixture();
    const original: HeightNavigationGraph = { cells: [], edgesByTileKey: new Map() };
    f.replace(original);
    expect(f.observer.sample().graphObservationId).toBe(1);
    f.replace(undefined);
    expect(f.observer.sample()).toEqual({ graphObservationId: null, updateRequestCount: 0 });
    f.replace(original);
    expect(f.observer.sample().graphObservationId).toBe(2);
    f.observer.dispose();
  });

  it("makes bounded update-count loss terminal instead of retaining a partial usable boundary", () => {
    const f = fixture();
    expect(f.observer.sample().graphObservationId).toBe(1);
    for (let index = 0; index < 8192; index++) f.scene.events.emit(NavigationService.UpdateNavigationEvent);
    expect(f.observer.sample()).toEqual({ graphObservationId: 1, updateRequestCount: 8192 });
    f.scene.events.emit(NavigationService.UpdateNavigationEvent);
    expect(f.observer.sample()).toEqual({ graphObservationId: null, updateRequestCount: null });
    f.replace({ cells: [], edgesByTileKey: new Map() });
    expect(f.observer.sample()).toEqual({ graphObservationId: null, updateRequestCount: null });
    f.observer.dispose();
  });

  it("bounds graph-reference observations without storing graph history", () => {
    const f = fixture();
    for (let index = 0; index < 8192; index++) {
      f.replace({ cells: [], edgesByTileKey: new Map() });
      expect(f.observer.sample().graphObservationId).toBe(index + 1);
    }
    f.replace({ cells: [], edgesByTileKey: new Map() });
    expect(f.observer.sample()).toEqual({ graphObservationId: null, updateRequestCount: null });
    expect(f.observer.sample()).toEqual({ graphObservationId: null, updateRequestCount: null });
    f.observer.dispose();
  });
});
