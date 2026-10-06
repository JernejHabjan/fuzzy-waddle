import type Phaser from "phaser";
import { observeProductionOutput } from "./observe-production-output";
import { productionCaptureItem } from "../../../player/ai-controller/testing/ai-runtime-production-capture-fixtures";

/** A lost listener diagnostic must never abort the already selected native action. */
describe("production output observation failure isolation", () => {
  it("skips absent handles/listeners and contains listener failure without reading another target or invoking an action", () => {
    const emit = jest.fn(() => { throw new Error("diagnostic_listener_failed"); });
    const listenerCount = jest.fn(() => 1);
    const producer = { scene: { events: { listenerCount, emit } } } as unknown as Phaser.GameObjects.GameObject;
    const product = {} as Phaser.GameObjects.GameObject;
    const item = productionCaptureItem();
    expect(() => observeProductionOutput(producer, undefined, product, "unset")).not.toThrow();
    expect(listenerCount).not.toHaveBeenCalled();
    listenerCount.mockReturnValueOnce(0);
    observeProductionOutput(producer, item, product, "movement_fallback");
    expect(emit).not.toHaveBeenCalled();
    expect(() => observeProductionOutput(producer, item, product, "unset")).not.toThrow();
    expect(emit).toHaveBeenCalledTimes(1);
  });
});
