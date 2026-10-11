import type Phaser from "phaser";
import { ResourceServiceObservation } from "../../../entity/components/resource/resource-service-observation";
import { AiRuntimeResourceCoverageCapture } from "./ai-runtime-resource-coverage-capture";

describe("resource coverage loss authority", () => {
  it("fences a failed before-read while the native mutation runs once, and later success cannot revive it", () => {
    const actor = {} as Phaser.GameObjects.GameObject;
    const coverage = new AiRuntimeResourceCoverageCapture(10, () => ({ tick: 10, captureSequence: 4 }));
    const release = ResourceServiceObservation.subscribe(actor, () => undefined, coverage.lose);
    const mutate = jest.fn();
    ResourceServiceObservation.change(actor, {}, () => { throw new Error("reader"); }, { reason: "reset" }, mutate);
    ResourceServiceObservation.change(actor, {}, () => ({ amount: 0, resourceType: null }), { reason: "reset" }, mutate);
    expect(mutate).toHaveBeenCalledTimes(2);
    expect(coverage.read()).toMatchObject({ lost: true, lossEpoch: 1, losses: ["resource_before_read_failed"] });
    release();
    expect(coverage.read().lossEpoch).toBe(2);
  });
  it("records exact fresh component installation and fences saturation/fast-forward", () => {
    let tick = 10, sequence = 4;
    const coverage = new AiRuntimeResourceCoverageCapture(tick, () => ({ tick, captureSequence: sequence }));
    const first = {};
    coverage.install(first, "worker", 1); coverage.install(first, "worker", 1);
    tick = 11; sequence = 8; coverage.tick(tick); coverage.install({}, "worker", 1);
    expect(coverage.read().cohorts).toMatchObject([{ cohortId: 1, installed: { tick: 10, captureSequence: 4 } },
      { cohortId: 2, installed: { tick: 11, captureSequence: 8 } }]);
    for (let index = 2; index < 257; index++) coverage.install({}, `worker:${index}`, 1);
    tick = 14; coverage.tick(tick);
    expect(coverage.read().cohorts).toHaveLength(256);
    expect(coverage.read()).toMatchObject({ lost: true,
      losses: ["component_or_actor_identity_replaced", "cohort_overflow", "tick_discontinuity"] });
  });
  it("fences restore before a broken diagnostic can hide the attempt; subscriber overflow stays unavailable", () => {
    const actor = {} as Phaser.GameObjects.GameObject;
    const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: 0 }));
    const releases = Array.from({ length: 8 }, () => ResourceServiceObservation.subscribe(actor, () => undefined));
    const extra = ResourceServiceObservation.subscribe(actor, () => undefined, coverage.lose);
    expect(coverage.read()).toMatchObject({ lost: true, losses: ["resource_subscription_overflow"] });
    releases.forEach((release) => release()); extra();
    const release = ResourceServiceObservation.subscribe(actor, () => { throw new Error("lost_record"); }, coverage.lose);
    const native = jest.fn(() => expect(coverage.read().losses).toContain("resource_restore_attempt"));
    ResourceServiceObservation.change(actor, {}, () => ({ amount: 0, resourceType: null }), { reason: "restore" }, native);
    expect(native).toHaveBeenCalledTimes(1); release();
  });
  it("preserves the exact native exception and one mutation even when the loss sink itself fails", () => {
    const actor = {} as Phaser.GameObjects.GameObject, error = new Error("native_mutation");
    const loss = jest.fn(() => { throw new Error("diagnostic"); });
    const release = ResourceServiceObservation.subscribe(actor, () => undefined, loss);
    const native = jest.fn(() => { throw error; });
    expect(() => ResourceServiceObservation.change(actor, {}, () => ({ amount: 0, resourceType: null }),
      { reason: "reset" }, native)).toThrow(error);
    expect(native).toHaveBeenCalledTimes(1); expect(loss).toHaveBeenCalledWith("resource_mutation_threw");
    release();
  });
});
