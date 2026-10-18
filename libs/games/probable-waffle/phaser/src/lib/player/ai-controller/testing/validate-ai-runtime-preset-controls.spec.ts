import { validAiRuntimePresetControls, validAiRuntimePresetRallies } from "./validate-ai-runtime-preset-controls";

const owners = new Map<string, number | null>([
  ["producer", 2],
  ["rally", 2],
  ["enemy", 1],
  ["resource", null]
]);
const rally = {
  id: "initial-rally",
  requestTick: 0,
  applicationTick: 0,
  producerFixtureActorId: "producer",
  action: { kind: "rally", targetFixtureActorId: "rally" }
};
const cancel = {
  id: "cancel-paid-tail",
  requestTick: 20,
  applicationTick: 40,
  producerFixtureActorId: "producer",
  action: { kind: "cancel_production", setupQueueIndex: 1 }
};

it("accepts bounded same-owner rally and delayed cancellation inputs", () => {
  expect(validAiRuntimePresetControls([rally, cancel], owners)).toBe(true);
});

it("bounds movement and distinguishes an owned destination from a live opposing attack role", () => {
  const withAction = (action: unknown) => [{ ...rally, action }];
  expect(validAiRuntimePresetControls(withAction({ kind: "move", worldPosition: { x: 320, y: 400, z: 0 } }), owners)).toBe(true);
  expect(validAiRuntimePresetControls(withAction({ kind: "move_to_actor", targetFixtureActorId: "rally" }), owners)).toBe(true);
  expect(validAiRuntimePresetControls(withAction({ kind: "attack", targetFixtureActorId: "enemy" }), owners)).toBe(true);
  for (const action of [
    { kind: "move", worldPosition: { x: Infinity, y: 400, z: 0 } },
    { kind: "move", worldPosition: { x: 320, y: -1, z: 0 } },
    { kind: "move", worldPosition: { x: 320, y: 400, z: 5000 } },
    { kind: "move", worldPosition: { x: 320, y: 400, z: 0 }, forcedArrival: true },
    { kind: "move_to_actor", targetFixtureActorId: "enemy" },
    { kind: "attack", targetFixtureActorId: "rally" },
    { kind: "attack", targetFixtureActorId: "resource" }
  ]) expect(validAiRuntimePresetControls(withAction(action), owners)).toBe(false);
});

it.each(["enemy", "resource", "missing", "producer"])("rejects invalid rally target %s", (targetFixtureActorId) => {
  expect(validAiRuntimePresetControls([{ ...rally, action: { ...rally.action, targetFixtureActorId } }], owners)).toBe(
    false
  );
});

it("rejects duplicate controls, unknown fields/actions, invalid dates and indices", () => {
  for (const input of [
    [rally, rally],
    [{ ...cancel, applicationTick: 19 }],
    [{ ...cancel, requestTick: -1 }],
    [{ ...cancel, injectedAssessment: {} }],
    [{ ...cancel, action: { kind: "cancel_production", setupQueueIndex: -1 } }],
    [{ ...cancel, action: { kind: "brain_state" } }],
    Array.from({ length: 33 }, () => cancel)
  ]) {
    expect(validAiRuntimePresetControls(input, owners)).toBe(false);
  }
});

it("rejects cross-owner, undeclared or duplicate production rally policies", () => {
  const rule = { owner: 2, producerObjectName: "AnkGuard", targetFixtureActorId: "rally" };
  expect(validAiRuntimePresetRallies([rule], owners)).toBe(true);
  for (const input of [
    [rule, rule],
    [{ ...rule, targetFixtureActorId: "enemy" }],
    [{ ...rule, targetFixtureActorId: "missing" }],
    [{ ...rule, producerObjectName: "unknown" }]
  ]) {
    expect(validAiRuntimePresetRallies(input, owners)).toBe(false);
  }
});
