import { expect, test } from "@playwright/test";
import { canonicalNativePairValue } from "./skirmish-ai-native-scenario-pairs";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";

test("native hidden-pair canonicalization ignores fixture names embedded in queued IDs", () => {
  const make = (actorId: string, branch: string) => {
    const context = {
      roles: { "ready-producer": actorId },
      frames: [{ decision: { input: { observation: { actors: [{ actorId }] } } } }]
    } as unknown as ReturnType<typeof nativeScenarioContext>;
    return canonicalNativePairValue({
      queue: { itemId: `queue:${actorId}:2:0:2:runtime-fixture-759940-scout-01-tivara-${branch}` }
    }, context);
  };

  expect(make("sim-c6a8f94c", "hidden-a")).toEqual(make("sim-bccd16e1", "hidden-b"));
});

test("native hidden-pair canonicalization treats access products as an unordered observation set", () => {
  const context = {
    roles: { "scout-probe": "sim-c6a8f94c" },
    frames: [{ decision: { input: { observation: { actors: [{ actorId: "sim-c6a8f94c", relation: "self",
      owner: 2, objectName: "TivaraMacemanMale", logicalPosition: { status: "known", value: { x: 4, y: 5, z: 0 } } }] } } } }]
  } as unknown as ReturnType<typeof nativeScenarioContext>;
  const first = { accessProducts: [
    { queryId: "query:access:sim-c6a8f94c:sim-c6a8f94c", status: "ready" },
    { queryId: "query:access:sim-c6a8f94c:sim-c6a8f94c", status: "blocked" }
  ] };

  expect(canonicalNativePairValue(first, context)).toEqual(
    canonicalNativePairValue({ accessProducts: [...first.accessProducts].reverse() }, context)
  );
});

test("native hidden-pair canonicalization treats independent claims as an unordered set", () => {
  const context = {
    roles: {},
    frames: [{ decision: { input: { observation: { actors: [] } } } }]
  } as unknown as ReturnType<typeof nativeScenarioContext>;
  const claims = [
    { claimId: "claim:actor:a", kind: "actor", actorId: "sim-c6a8f94c" },
    { claimId: "claim:actor:b", kind: "actor", actorId: "sim-bccd16e1" }
  ];

  expect(canonicalNativePairValue({ claims }, context)).toEqual(
    canonicalNativePairValue({ claims: [...claims].reverse() }, context)
  );
});

test("native hidden-pair canonicalization treats the post-arbitration accepted intent collection as a set", () => {
  const context = {
    roles: {},
    frames: [{ decision: { input: { observation: { actors: [] } } } }]
  } as unknown as ReturnType<typeof nativeScenarioContext>;
  const acceptedIntents = [
    { kind: "move", actorIds: ["sim-c6a8f94c"], logicalPosition: { x: 3, y: 4, z: 0 } },
    { kind: "attack", actorIds: ["sim-bccd16e1"], targetActorId: "sim-deadbeef" }
  ];

  expect(canonicalNativePairValue({ acceptedIntents }, context)).toEqual(
    canonicalNativePairValue({ acceptedIntents: [...acceptedIntents].reverse() }, context)
  );
});

test("native hidden-pair canonicalization aliases equivalent actors first seen after opening", () => {
  const make = (actorId: string) => {
    const context = {
      roles: {},
      frames: [
        { decision: { input: { observation: { actors: [] } } } },
        { decision: { input: { observation: { actors: [{ actorId, relation: "self", owner: 2,
          objectName: "TivaraMacemanMale", logicalPosition: { status: "known", value: { x: 4, y: 5, z: 0 } } }] } } } }
      ]
    } as unknown as ReturnType<typeof nativeScenarioContext>;
    return canonicalNativePairValue({ actorId }, context);
  };

  expect(make("sim-1333faf0")).toEqual(make("sim-50b1050f"));
});

test("native hidden-pair canonicalization treats same-position workers as equivalent across authored roles", () => {
  const make = (actorId: string, role: string) => {
    const context = {
      roles: { [role]: actorId },
      frames: [{ decision: { input: { observation: { actors: [{ actorId, relation: "self", owner: 2,
        objectName: "TivaraWorkerMale", logicalPosition: { status: "known", value: { x: 4, y: 5, z: 0 } } }] } } } }]
    } as unknown as ReturnType<typeof nativeScenarioContext>;
    return canonicalNativePairValue({ actorId }, context);
  };

  expect(make("sim-c6a8f94c", "worker-7")).toEqual(make("sim-bccd16e1", "worker-6"));
});
