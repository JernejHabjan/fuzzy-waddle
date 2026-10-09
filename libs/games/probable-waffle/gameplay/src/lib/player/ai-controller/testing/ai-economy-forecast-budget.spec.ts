import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

import { unknownAiValue } from "./ai-test-fixtures";
import { catalog, demand, world, proposal } from "./ai-economy-forecast-test-fixtures";

describe("typed deterministic economy forecast scenarios", () => {
  it("ECO-05: leaves returning and loaded workers alone and retains the final food gatherer", () => {
    const baseline = world(0, 1000);
    const workers = baseline.actors.map((actor) => {
      if (actor.actorId === "worker-0")
        return {
          ...actor,
          activeOrder: {
            status: "known" as const,
            observedTick: 20,
            value: { orderType: OrderType.ReturnResources, targetActorId: "producer" }
          }
        };
      if (actor.actorId === "worker-1")
        return {
          ...actor,
          resourceState: {
            status: "known" as const,
            observedTick: 20,
            value: {
              resourceType: ResourceType.Food,
              available: unknownAiValue,
              carried: { status: "known" as const, observedTick: 20, value: 10 },
              growthReadyTick: unknownAiValue,
              serviceCapacity: unknownAiValue
            }
          }
        };
      return actor;
    });
    const result = proposal(0, 1000, [demand], { ...baseline, actors: workers });
    expect(result.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        actorIds: ["worker-2"],
        sourceActorId: "wood-source"
      })
    );
    const oneFoodWorker = proposal(0, 1000, [demand], {
      ...baseline,
      actors: baseline.actors.filter((actor) => !actor.actorId.startsWith("worker-") || actor.actorId === "worker-1")
    });
    expect(
      oneFoodWorker.intents.some(
        (intent) => intent.kind === "assign_gatherers" && intent.reasonCode.startsWith("economy:surplus_transfer")
      )
    ).toBe(false);
  });

  it("ECO-05: skips an idle worker unable to gather the shortage resource", () => {
    const baseline = world(0, 1000);
    const limitedCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: [
        ...catalog.entries
          .filter((entry) => entry.sourceObjectName === ObjectNames.TivaraWorker)
          .map((entry) => ({
            ...entry,
            sourceObjectName: ObjectNames.TivaraWorkerFemale,
            gathers: [ResourceType.Food]
          })),
        ...catalog.entries
      ]
    };
    const actors = baseline.actors.map((actor) =>
      actor.actorId === "worker-0" ? { ...actor, objectName: ObjectNames.TivaraWorkerFemale } : actor
    );
    const result = proposal(0, 1000, [demand], { ...baseline, actors }, limitedCatalog);
    expect(result.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        actorIds: ["worker-1"],
        resourceType: ResourceType.Wood,
        sourceActorId: "wood-source"
      })
    );
    expect(
      result.intents.some(
        (intent) =>
          intent.kind === "assign_gatherers" &&
          intent.actorIds.includes("worker-0") &&
          intent.resourceType === ResourceType.Wood
      )
    ).toBe(false);
  });
});
