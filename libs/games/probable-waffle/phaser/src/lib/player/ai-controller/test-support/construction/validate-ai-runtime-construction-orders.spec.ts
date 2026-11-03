import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { validAiRuntimeConstructionOrders } from "./validate-ai-runtime-construction-orders";

function tables() {
  return {
    ids: new Set(["builder-one", "builder-two", "enemy-builder"]),
    owners: new Map<string, number | null>([["builder-one", 2], ["builder-two", 2], ["enemy-builder", 1]]),
    names: new Map<string, string>([["builder-one", ObjectNames.TivaraWorkerMale]])
  };
}
const order = {
  fixtureActorId: "unfinished-producer", actorName: ObjectNames.AnkGuard,
  builderFixtureActorIds: ["builder-one"], position: { x: 800, y: 848, z: 0 }
};

describe("native unfinished-site declarations", () => {
  it("binds one declared site owner/identity for exact later native losses and cancellation", () => {
    const state = tables();
    expect(validAiRuntimeConstructionOrders([order], state.ids, state.owners, state.names)).toBe(true);
    expect(state.ids.has(order.fixtureActorId)).toBe(true);
    expect(state.owners.get(order.fixtureActorId)).toBe(2);
    expect(state.names.get(order.fixtureActorId)).toBe(ObjectNames.AnkGuard);
  });

  it("rejects conflicting primary worker jobs, reused roles, cross-owner groups and invalid coordinates", () => {
    const invalid = [
      [{ ...order, fixtureActorId: "builder-one" }],
      [{ ...order, builderFixtureActorIds: ["builder-one", "builder-one"] }],
      [{ ...order, builderFixtureActorIds: ["builder-one", "enemy-builder"] }],
      [{ ...order, builderFixtureActorIds: ["not-declared"] }],
      [{ ...order, builderFixtureActorIds: [] }],
      [{ ...order, position: { x: Number.NaN, y: 848, z: 0 } }],
      [{ ...order, position: { x: 800, y: -1, z: 0 } }],
      [{ ...order, position: { x: 800, y: 848, z: 0, extra: true } }],
      [order, { ...order, fixtureActorId: "another-site" }],
      [order, { ...order, fixtureActorId: "another-site", builderFixtureActorIds: [order.fixtureActorId] }],
      Array.from({ length: 9 }, (_, index) => ({ ...order, fixtureActorId: `site-${index}` }))
    ];
    for (const input of invalid) {
      const state = tables();
      expect(validAiRuntimeConstructionOrders(input, state.ids, state.owners, state.names)).toBe(false);
    }
  });
});
