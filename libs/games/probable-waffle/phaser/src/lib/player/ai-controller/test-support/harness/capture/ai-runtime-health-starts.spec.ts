import { validAiRuntimeHealthStarts } from "./ai-runtime-health-starts";

describe("native preset durability", () => {
  it("admits bounded living starts while rejecting undeclared, duplicate, lethal or invented-health controls", () => {
    const ids = new Set(["ranged-probe"]), start = { fixtureActorId: "ranged-probe", healthPermille: 350, armourPermille: 0 };
    expect(validAiRuntimeHealthStarts([start], ids)).toBe(true);
    for (const value of [[start, start], [{ ...start, fixtureActorId: "hidden-undeclared" }],
      [{ ...start, healthPermille: 0 }], [{ ...start, healthPermille: 1001 }], [{ ...start, armourPermille: -1 }],
      [{ ...start, healedByAi: true }]]) expect(validAiRuntimeHealthStarts(value, ids)).toBe(false);
  });
});
