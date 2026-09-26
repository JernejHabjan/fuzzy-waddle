import { evaluateRuntimeSupplyPrebuild } from "./skirmish-ai-runtime-supply-evaluation";

const requirement = { minimumBuffer: 3, latestTick: 800, housingObjectName: "Olival" } as const;

describe("authoritative queued-supply runtime oracle", () => {
  it("fails closed when no queued population ever creates a real capacity deficit", () => {
    expect(
      evaluateRuntimeSupplyPrebuild(
        [{ tick: 20, readyHousingCapacity: 16, usedPopulation: 4, queuedPopulation: 0, readyHousingActorNames: [] }],
        requirement
      )
    ).toEqual(["supply_prebuild_precondition_missing"]);
  });

  it("requires a real completed housing gain by the authored deadline", () => {
    const pressured = {
      tick: 20,
      readyHousingCapacity: 8,
      usedPopulation: 4,
      queuedPopulation: 4,
      readyHousingActorNames: ["Olival"]
    };
    expect(evaluateRuntimeSupplyPrebuild([pressured, { ...pressured, tick: 800 }], requirement)).toEqual([
      "supply_not_prebuilt_before_deadline"
    ]);
    expect(
      evaluateRuntimeSupplyPrebuild(
        [pressured, { ...pressured, tick: 400, readyHousingCapacity: 16, readyHousingActorNames: ["Olival", "Olival"] }],
        requirement
      )
    ).toEqual([]);
    expect(
      evaluateRuntimeSupplyPrebuild(
        [pressured, { ...pressured, tick: 900, readyHousingCapacity: 16, readyHousingActorNames: ["Olival", "Olival"] }],
        requirement
      )
    ).toEqual(["supply_not_prebuilt_before_deadline"]);
  });
});
