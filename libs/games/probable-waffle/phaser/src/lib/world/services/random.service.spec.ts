import { RandomService } from "./random.service";

describe("RandomService state", () => {
  it("continues the exact sequence after state restoration", () => {
    const source = new RandomService("campaign-seed");
    source.frac();
    source.between(2, 9);
    const saved = source.getState();
    const expected = [source.random(), source.between(10, 20), source.pick(["a", "b", "c"])] as const;
    const restored = new RandomService("different-seed");

    restored.restoreState(saved);

    expect([restored.random(), restored.between(10, 20), restored.pick(["a", "b", "c"])]).toEqual(expected);
    expect(restored.getState().operationCount).toBe(source.getState().operationCount);
  });

  it("rejects malformed or unknown state", () => {
    const service = new RandomService("campaign-seed");
    expect(() =>
      service.restoreState({ schemaVersion: 1, generatorState: "not-random-state", operationCount: 0 })
    ).toThrow("Unsupported deterministic random state");
  });
});
