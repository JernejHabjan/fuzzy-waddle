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
