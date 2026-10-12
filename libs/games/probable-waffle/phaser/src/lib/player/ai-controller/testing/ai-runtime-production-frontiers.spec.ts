import { AiRuntimeProductionFrontiers } from "./ai-runtime-production-frontiers";

const state = () => ({ afterSequence: 1, actors: [], queues: [], completedResearch: [] });

describe("native production closed intervals", () => {
  it("coalesces unchanged states but retains exact deadlines, despite a later browser read", () => {
    const history = new AiRuntimeProductionFrontiers();
    history.arm(8, 0);
    history.require([3]);
    for (let tick = 1; tick <= 12; tick++) history.close(tick, state);
    const result = history.read();
    expect(result.gaps).toEqual([]);
    expect(result.closedThroughTick).toBe(8);
    expect(result.intervals.map((interval) => [interval.closedFromTick, interval.closedThroughTick])).toEqual([
      [0, 2],
      [3, 3],
      [4, 7],
      [8, 8]
    ]);
    expect(result.intervals.at(-1)?.capturedAtTick).toBe(9);
  });

  it("does not relabel a skipped tick or reconstruct a deadline discovered too late", () => {
    const skipped = new AiRuntimeProductionFrontiers();
    skipped.arm(8, 0);
    skipped.close(2, state);
    expect(skipped.read().gaps).toContain("production_frontier_clock_gap");
    const late = new AiRuntimeProductionFrontiers();
    late.arm(8, 0);
    late.close(1, state);
    late.require([0]);
    expect(late.read().gaps).toContain("production_frontier_deadline_unavailable");
  });

  it("keeps changed exposure intervals and does not erase an invalid binding with a later good one", () => {
    const history = new AiRuntimeProductionFrontiers();
    history.arm(3, 0);
    for (let tick = 1; tick <= 4; tick++)
      history.close(tick, () => ({ ...state(), exposure: { selectedSequence: tick < 3 ? 1 : 2, valid: tick !== 2 } }));
    expect(history.read().intervals.map((interval) => interval.exposure?.valid)).toEqual([true, false, true, true]);
  });

  it("refuses late installation and preserves shutdown/fast-forward losses", () => {
    const late = new AiRuntimeProductionFrontiers();
    late.arm(8, 1);
    expect(late.read().gaps).toContain("production_frontier_horizon_invalid");
    const history = new AiRuntimeProductionFrontiers();
    history.arm(8, 0);
    history.close(1, state);
    history.lose("simulation_clock_fast_forward");
    history.close(2, state);
    expect(history.read().closedThroughTick).toBe(0);
    expect(history.read().gaps).toContain("simulation_clock_fast_forward");
  });
});
