import Phaser from "phaser";
import type { NavigationService } from "../../../world/services/navigation.service";
import { NavigationProvenance } from "../../../world/services/navigation-provenance";
import { AiRuntimeNavigationObservation } from "./ai-runtime-navigation-observation";

/** Scoped native seam only; real world movement/rebuild timing remains final-gate work. */
function fixture() {
  const provenance = new NavigationProvenance();
  const scene = { events: new Phaser.Events.EventEmitter() } as unknown as Phaser.Scene;
  const native = jest.fn(() => provenance.sample());
  const navigation = { getHeightGraphDebugSnapshot: () => ({ cells: [], edgesByTileKey: new Map() }),
    getNativeNavigationBoundary: native,
    observeNativeNavigationQuery: <T>(call: () => T, observer: Parameters<NavigationProvenance["observe"]>[1]) =>
      provenance.observe(call, observer) } satisfies Pick<NavigationService,
        "getHeightGraphDebugSnapshot" | "getNativeNavigationBoundary" | "observeNativeNavigationQuery">;
  const observation = new AiRuntimeNavigationObservation(scene, navigation as unknown as NavigationService);
  const lookup = () => provenance.query("ground_overlay", { x: 0, y: 0 }, { x: 1, y: 0 }, "bypass", null);
  return { provenance, observation, native, lookup };
}

describe("marked native query ownership", () => {
  it("retains the exact Promise and detaches native completion at the outer terminal", async () => {
    const f = fixture(), holder = f.observation.query(), promise = Promise.resolve([]);
    const result = holder.invoke(() => { const query = f.lookup(); f.provenance.completed(query); return promise; });
    expect(result).toBe(promise);
    const sampled = holder.sample();
    expect(sampled).toMatchObject({ queryId: 1, engine: "ground_overlay", cache: "bypass", completed: { completedRebuild: 0 } });
    f.provenance.beginRebuild();
    expect(sampled?.completed?.rebuildInProgress).toBe(false);
    f.observation.release(holder); expect(holder.sample()).toBeUndefined();
    await promise; f.observation.dispose();
  });

  it("keeps multiple, missing and post-disposal lookups unavailable without extra queries", () => {
    const f = fixture(), multiple = f.observation.query(), missing = f.observation.query();
    multiple.invoke(() => { f.lookup(); f.lookup(); });
    expect(multiple.sample()).toBeUndefined();
    missing.invoke(() => 7); expect(missing.sample()).toBeUndefined();
    const pending = f.observation.query(); pending.invoke(f.lookup);
    expect(pending.sample()?.queryId).toBe(3);
    f.observation.dispose(); expect(pending.sample()).toBeUndefined();
    expect(pending.invoke(() => 9)).toBe(9);
    expect(f.observation.query().invoke(() => 10)).toBe(10);
  });

  it("bounds pending ownership at 256 and releases capacity without suppressing native invocation", () => {
    const f = fixture(), holders = Array.from({ length: 257 }, () => f.observation.query());
    holders.forEach((holder) => holder.invoke(f.lookup));
    expect(holders[255]?.sample()?.queryId).toBe(256);
    expect(holders[256]?.sample()).toBeUndefined();
    f.observation.release(holders[0]);
    const next = f.observation.query(); next.invoke(f.lookup);
    expect(next.sample()?.queryId).toBe(258);
    f.observation.dispose();
  });

  it("makes native reader loss terminal independently of graph-reference observations", () => {
    const f = fixture();
    expect(f.observation.sample().native).not.toBeNull();
    f.native.mockImplementationOnce(() => { throw new Error("native_reader"); });
    expect(f.observation.sample().native).toBeNull();
    expect(f.observation.sample().native).toBeNull();
    expect(f.native).toHaveBeenCalledTimes(2);
    f.observation.dispose();
  });
});
