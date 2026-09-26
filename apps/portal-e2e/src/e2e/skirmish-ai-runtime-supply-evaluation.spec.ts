import { expect, test } from "@playwright/test";
import { evaluateRuntimeSupplyControl, evaluateRuntimeSupplyPrebuild } from "./skirmish-ai-runtime-supply-evaluation";

const requirement = { minimumBuffer: 3, latestTick: 800, housingObjectName: "Olival" } as const;

test.describe("authoritative queued-supply runtime oracle", () => {
  test("fails closed when no queued population ever creates a real capacity deficit", () => {
    expect(
      evaluateRuntimeSupplyPrebuild(
        [{ tick: 20, readyHousingCapacity: 16, usedPopulation: 4, queuedPopulation: 0, readyHousingActorNames: [] }],
        requirement
      )
    ).toEqual(["supply_prebuild_precondition_missing"]);
  });

  test("requires a real completed housing gain by the authored deadline", () => {
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

  test("rejects speculative housing in an ample-capacity paired control", () => {
    const ample = {
      tick: 20,
      readyHousingCapacity: 24,
      usedPopulation: 4,
      queuedPopulation: 5,
      readyHousingActorNames: ["Olival", "Olival"]
    };
    expect(evaluateRuntimeSupplyControl([ample, { ...ample, tick: 800 }], requirement)).toEqual([]);
    expect(
      evaluateRuntimeSupplyControl(
        [ample, { ...ample, tick: 800, ownedConstruction: [{ actorId: "extra", objectName: "Olival", progress: 20 }] }],
        requirement
      )
    ).toEqual(["supply_control_unneeded_housing_attempt"]);
    expect(evaluateRuntimeSupplyControl([{ ...ample, queuedPopulation: 0 }], requirement)).toEqual([
      "supply_control_precondition_missing"
    ]);
  });
});
