import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { catalog, demand, world } from "../testing/ai-economy-forecast-test-fixtures";
import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { housingFundingResourceTypes, selectAiHousingFundingWorker } from "./ai-housing-funding";

function fixture() {
  const base = world(90, 0);
  const housing = {
    ...demand,
    capabilityOrRole: "housing",
    desired: 1,
    preferredObjectNames: [],
    resourceObligations: { [ResourceType.Wood]: 100 }
  };
  const workers = ["a", "b", "c"].map((id) => ({
    ...createAiTestOwnedActor(id),
    activeOrder: {
      status: "known" as const,
      observedTick: 20,
      value: { orderType: OrderType.Gather, targetActorId: "food-source" }
    },
    resourceState: {
      status: "known" as const,
      observedTick: 20,
      value: {
        resourceType: ResourceType.Food,
        carried: { status: "known" as const, observedTick: 20, value: 0 },
        available: { status: "unknown" as const, reason: "not_supported" as const },
        growthReadyTick: { status: "unknown" as const, reason: "not_supported" as const },
        serviceCapacity: { status: "unknown" as const, reason: "not_supported" as const }
      }
    }
  }));
  return { base, housing, workers };
}

describe("essential housing funding", () => {
  it("requires cash even for a small deficit, but stops counting paid/committed housing", () => {
    const f = fixture();
    expect([...housingFundingResourceTypes(f.base, catalog, [f.housing])]).toEqual([ResourceType.Wood]);
    expect(housingFundingResourceTypes(world(100, 0), catalog, [f.housing]).size).toBe(0);
    expect(housingFundingResourceTypes(f.base, catalog, [{ ...f.housing, constructingIds: ["site"] }]).size).toBe(0);
    expect(
      housingFundingResourceTypes(f.base, catalog, [{ ...f.housing, acceptedNotObservedEffectIds: ["effect:house"] }])
        .size
    ).toBe(0);
    expect(housingFundingResourceTypes(f.base, catalog, [demand]).size).toBe(0);
  });
  it("redirects unloaded labor without requiring a surplus cash bank, preserving the last food worker", () => {
    const f = fixture();
    expect(selectAiHousingFundingWorker(f.base, catalog, f.workers, ResourceType.Wood)?.actorId).toBe("a");
    expect(selectAiHousingFundingWorker(f.base, catalog, f.workers.slice(0, 1), ResourceType.Wood)).toBeUndefined();
  });
  it("preserves cargo, return orders, unavailable cargo and incompatible workers", () => {
    const f = fixture();
    const workers = f.workers.map((worker, index) =>
      index === 0
        ? {
            ...worker,
            resourceState: {
              ...worker.resourceState,
              value: { ...worker.resourceState.value, carried: { ...worker.resourceState.value.carried, value: 10 } }
            }
          }
        : index === 1
          ? {
              ...worker,
              activeOrder: {
                ...worker.activeOrder,
                value: { orderType: OrderType.ReturnResources, targetActorId: "producer" }
              }
            }
          : { ...worker, objectName: ObjectNames.AnkGuard }
    );
    expect(selectAiHousingFundingWorker(f.base, catalog, workers, ResourceType.Wood)).toBeUndefined();
  });
  it("does not treat a zero pack as free labor during native extraction", () => {
    const f = fixture();
    expect(
      selectAiHousingFundingWorker(
        f.base,
        catalog,
        f.workers.map((worker) => ({ ...worker, resourceTransferInFlight: true })),
        ResourceType.Wood
      )
    ).toBeUndefined();
  });

  it("can use a confirmed empty pack after its type cleared, without treating missing cargo as empty", () => {
    const f = fixture();
    const unknown = { status: "unknown" as const, reason: "not_supported" as const };
    const workers = f.workers.map((worker) => ({ ...worker, resourceState: unknown, carriedResourceAmount: 0 }));
    expect(selectAiHousingFundingWorker(f.base, catalog, workers, ResourceType.Wood)?.actorId).toBe("a");
    expect(
      selectAiHousingFundingWorker(
        f.base,
        catalog,
        workers.map(({ carriedResourceAmount, ...worker }) => worker),
        ResourceType.Wood
      )
    ).toBeUndefined();
  });
});
