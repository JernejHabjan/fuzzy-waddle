import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { validAiRuntimeExistingBindings } from "./validate-ai-runtime-existing-bindings";

const binding = { fixtureActorId: "main-producer", actorName: ObjectNames.Sandhold, owner: 2 };

it("registers a declared inherited role for queue and owner validation", () => {
  const ids = new Set<string>(),
    owners = new Map<string, number | null>(),
    names = new Map<string, string>();
  expect(validAiRuntimeExistingBindings([binding], ids, owners, names)).toBe(true);
  expect(ids.has(binding.fixtureActorId)).toBe(true);
  expect(owners.get(binding.fixtureActorId)).toBe(2);
  expect(names.get(binding.fixtureActorId)).toBe(ObjectNames.Sandhold);
});

it("admits exactly positioned inherited neutral sources while retaining neutral ownership", () => {
  const source = { ...binding, actorName: ObjectNames.Tree6, owner: null, position: { x: 608, y: 928, z: 0 } };
  const owners = new Map<string, number | null>();
  expect(validAiRuntimeExistingBindings([source], new Set(), owners, new Map())).toBe(true);
  expect(owners.get(source.fixtureActorId)).toBeNull();
  for (const position of [undefined, { x: 608, y: 928 }, { x: NaN, y: 928, z: 0 }, { x: 608, y: 928, z: 0, radius: 5 }]) {
    expect(validAiRuntimeExistingBindings([{ ...source, position }], new Set(), new Map(), new Map())).toBe(false);
  }
});

it("rejects collisions, unknown fields, invalid owners and unknown actor names", () => {
  for (const values of [
    [binding, binding],
    [{ ...binding, owner: null }],
    [{ ...binding, owner: 1.5 }],
    [{ ...binding, actorName: "unknown" }],
    [{ ...binding, fixtureActorId: "" }],
    [{ ...binding, position: { x: 0, y: 0 } }],
    Array.from({ length: 17 }, () => binding)
  ])
    expect(validAiRuntimeExistingBindings(values, new Set(), new Map(), new Map())).toBe(false);
  expect(validAiRuntimeExistingBindings([binding], new Set([binding.fixtureActorId]), new Map(), new Map())).toBe(
    false
  );
});
