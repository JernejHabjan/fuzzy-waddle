import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "../testing/ai-test-fixtures";
import { catalog, completedOpeningState } from "./ai-macro-test-fixtures";
import { proposeAiFieldLabor } from "./ai-field-labor-proposal";

function fixture(resource: ResourceType | null, targetObjectName = ObjectNames.Sandhold) {
  const observation = createAiTestObservation();
  const returned: { -readonly [K in keyof AiObservedActorV1]: AiObservedActorV1[K] } = {
    ...createAiTestOwnedActor("returning"),
    activeOrder: {
      status: "known",
      observedTick: observation.tick,
      value: { orderType: OrderType.ReturnResources, targetActorId: "dropoff" }
    },
    resourceState:
      resource === null
        ? unknownAiValue
        : {
            status: "known",
            observedTick: observation.tick,
            value: {
              resourceType: resource,
              available: unknownAiValue,
              carried: { status: "known", value: 5, observedTick: observation.tick },
              growthReadyTick: unknownAiValue,
              serviceCapacity: unknownAiValue
            }
          }
  } satisfies AiObservedActorV1;
  const woodWorker = {
    ...createAiTestOwnedActor("wood-worker"),
    activeOrder: {
      status: "known",
      observedTick: observation.tick,
      value: { orderType: OrderType.Gather, targetActorId: "tree" }
    }
  } satisfies AiObservedActorV1;
  const field = { ...createAiTestOwnedActor("field"), objectName: ObjectNames.Field };
  const drain = { ...createAiTestOwnedActor("dropoff"), objectName: targetObjectName };
  const self = [returned, woodWorker, field, drain];
  const nativeDropoffs = {
    ...catalog,
    entries: catalog.entries.map((entry) =>
      entry.sourceObjectName === ObjectNames.Sandhold
        ? { ...entry, acceptsResources: [ResourceType.Food, ResourceType.Wood] }
        : entry
    )
  };
  const propose = () =>
    proposeAiFieldLabor(
      { ...observation, actors: self },
      completedOpeningState(),
      nativeDropoffs,
      self,
      [field],
      ObjectNames.Granary,
      new Set(),
      [],
      0
    );
  return { propose, self, farmer: returned };
}

describe("Field labor during native food returns", () => {
  it("keeps a returning farmer's Field occupied when food goes to a main building", () => {
    const f = fixture(ResourceType.Food);
    expect(f.propose()).toBeNull();
    const farmer = f.farmer;
    if (!farmer) throw new Error("Missing returning farmer");
    farmer.activeOrder = {
      status: "known",
      observedTick: 20,
      value: { orderType: OrderType.Gather, targetActorId: "field" }
    };
    expect(f.propose()).toBeNull();
    farmer.activeOrder = { status: "known", observedTick: 20, value: null };
    expect(f.propose()).toMatchObject({ sourceActorId: "field", actorIds: ["wood-worker"] });
    if (farmer.resourceState.status !== "known") throw new Error("Missing farmer cargo");
    farmer.resourceState = { ...farmer.resourceState, value: { ...farmer.resourceState.value,
      carried: { status: "known", value: 0, observedTick: 20 } } };
    expect(f.propose()).toMatchObject({ sourceActorId: "field", actorIds: ["returning"] });
  });
  it("defers another farmer when cargo identity is unavailable at a food-capable dropoff", () => {
    expect(fixture(null).propose()).toBeNull();
  });
  it("does not confuse known wood delivery with a returning farmer", () => {
    expect(fixture(ResourceType.Wood).propose()).toMatchObject({ sourceActorId: "field", actorIds: ["wood-worker"] });
  });
});
