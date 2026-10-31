import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "../testing/ai-test-fixtures";
import { catalog, completedOpeningState } from "./ai-macro-test-fixtures";
import { proposeAiFieldLabor } from "./ai-field-labor-proposal";

function fixture(resource: ResourceType | null, fieldCount = 1, targetObjectName = ObjectNames.Sandhold) {
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
  const fields = Array.from({ length: fieldCount }, (_, index) => ({
    ...createAiTestOwnedActor(index === 0 ? "field" : `field-${index + 1}`),
    objectName: ObjectNames.Field,
    resourceState: {
      status: "known" as const,
      observedTick: observation.tick,
      value: {
        resourceType: ResourceType.Food,
        available: { status: "known" as const, value: 100, observedTick: observation.tick },
        carried: unknownAiValue,
        growthReadyTick: unknownAiValue,
        serviceCapacity: { status: "known" as const, value: 1, observedTick: observation.tick }
      }
    }
  }));
  const drain = { ...createAiTestOwnedActor("dropoff"), objectName: targetObjectName };
  const self = [returned, woodWorker, ...fields, drain];
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
      fields,
      ObjectNames.Granary,
      new Set(),
      [],
      0
    );
  return { propose, self, farmer: returned };
}

function requiredActor(actors: readonly AiObservedActorV1[], actorId: string): AiObservedActorV1 {
  const actor = actors.find((candidate) => candidate.actorId === actorId);
  if (!actor) throw new Error(`Missing expected actor ${actorId}`);
  return actor;
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
    farmer.resourceState = {
      ...farmer.resourceState,
      value: { ...farmer.resourceState.value, carried: { status: "known", value: 0, observedTick: 20 } }
    };
    expect(f.propose()).toMatchObject({ sourceActorId: "field", actorIds: ["returning"] });
  });
  it("assigns another Field while reserving the ambiguous returning farmer's source", () => {
    expect(fixture(ResourceType.Food, 2).propose()).toMatchObject({
      sourceActorId: "field-2",
      actorIds: ["wood-worker"]
    });
  });
  it("defers another farmer when cargo identity is unavailable at a food-capable dropoff", () => {
    expect(fixture(null).propose()).toBeNull();
  });
  it("does not confuse known wood delivery with a returning farmer", () => {
    expect(fixture(ResourceType.Wood).propose()).toMatchObject({ sourceActorId: "field", actorIds: ["wood-worker"] });
  });
  it("assigns a Field to its closest eligible farmer before using stable geometry tie-breaks", () => {
    const f = fixture(ResourceType.Wood);
    const field = {
      ...requiredActor(f.self, "field"),
      logicalPosition: { status: "known" as const, value: { x: 30, y: 22, z: 0 }, observedTick: 20 }
    };
    const near = {
      ...createAiTestOwnedActor("z-worker"),
      logicalPosition: { status: "known" as const, value: { x: 31, y: 22, z: 0 }, observedTick: 20 }
    };
    const far = {
      ...createAiTestOwnedActor("a-worker"),
      logicalPosition: { status: "known" as const, value: { x: 50, y: 22, z: 0 }, observedTick: 20 }
    };
    const self = [
      ...f.self.map((actor) =>
        actor.actorId === "field" ? field : actor.actorId === "wood-worker"
          ? { ...actor, logicalPosition: { status: "known" as const, value: { x: 45, y: 22, z: 0 }, observedTick: 20 } }
          : actor),
      near,
      far
    ];
    const proposal = proposeAiFieldLabor(
      { ...createAiTestObservation(), actors: self },
      completedOpeningState(),
      catalog,
      self,
      [field],
      ObjectNames.Granary,
      new Set(),
      [],
      0
    );

    expect(proposal?.actorIds).toEqual(["z-worker"]);
  });
  it("prefers a farmer in the Field's observed access region over a closer disconnected-region worker", () => {
    const f = fixture(ResourceType.Wood);
    const field = {
      ...requiredActor(f.self, "field"),
      logicalPosition: { status: "known" as const, value: { x: 30, y: 22, z: 0 }, observedTick: 20 },
      accessNodeId: { status: "known" as const, value: "access:field-region", observedTick: 20 }
    };
    const near = {
      ...createAiTestOwnedActor("z-near"),
      logicalPosition: { status: "known" as const, value: { x: 31, y: 22, z: 0 }, observedTick: 20 },
      accessNodeId: { status: "known" as const, value: "access:other-region", observedTick: 20 }
    };
    const reachable = {
      ...createAiTestOwnedActor("a-reachable"),
      logicalPosition: { status: "known" as const, value: { x: 38, y: 22, z: 0 }, observedTick: 20 },
      accessNodeId: { status: "known" as const, value: "access:field-region", observedTick: 20 }
    };
    const self = [...f.self.filter((actor) => actor.actorId !== "field"), field, near, reachable];
    const proposal = proposeAiFieldLabor(
      { ...createAiTestObservation(), actors: self },
      completedOpeningState(),
      catalog,
      self,
      [field],
      ObjectNames.Granary,
      new Set(),
      [],
      0
    );

    expect(proposal?.actorIds).toEqual(["a-reachable"]);
  });
  it("selects the geometrically first unstaffed Field when source IDs are reversed", () => {
    const f = fixture(ResourceType.Wood);
    const near = { ...requiredActor(f.self, "field") };
    near.actorId = "z-field";
    const far = {
      ...createAiTestOwnedActor("a-field"),
      objectName: ObjectNames.Field,
      logicalPosition: { status: "known" as const, value: { x: 20, y: 20, z: 0 }, observedTick: 20 }
    };
    const self = [...f.self.filter((actor) => actor.actorId !== "field"), near, far];
    const proposal = proposeAiFieldLabor(
      { ...createAiTestObservation(), actors: self },
      completedOpeningState(),
      catalog,
      self,
      [far, near],
      ObjectNames.Granary,
      new Set(),
      [],
      0
    );

    expect(proposal?.sourceActorId).toBe("z-field");
  });
});
