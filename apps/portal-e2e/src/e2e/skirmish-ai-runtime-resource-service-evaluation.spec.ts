import { expect, test } from "@playwright/test";
import { evaluateRuntimeResourceService } from "./skirmish-ai-runtime-resource-service-evaluation";

const requirement = {
  sourceObjectName: "Tree1",
  serviceObjectName: "WorkMill",
  resourceType: "wood",
  maximumTileDistance: 10,
  latestTick: 800
} as const;

const source = {
  actorId: "forest", objectName: "Tree1", relation: "neutral", x: 20, y: 20, ready: true, resourceType: "wood"
};
const remote = {
  actorId: "old", objectName: "WorkMill", relation: "self", x: 2, y: 20, ready: true, resourceType: null
};
const local = {
  actorId: "new", objectName: "WorkMill", relation: "self", x: 24, y: 20, ready: true, resourceType: null
};
const first = { tick: 20, resourceServiceActors: [source, remote], appliedCommands: [] };
const applied = { commandId: "build", effectId: "effect:resource-service:forest:1" };

test.describe("resource-service runtime oracle", () => {
  test("requires an observed source, applied command and completed nearby drop-off", () => {
    const variant = {
      presetFixtureId: "underserved-forest",
      presetCreatedActorNames: ["Tree1", "WorkMill"],
      resourceServiceBranch: "build" as const,
      checkpoints: [first, { tick: 500, resourceServiceActors: [source, remote, local], appliedCommands: [applied] }]
    };
    expect(evaluateRuntimeResourceService(requirement, variant)).toEqual([]);
    expect(evaluateRuntimeResourceService(requirement, { ...variant, checkpoints: [first] })).toEqual([
      "resource_service_command_not_applied", "resource_service_local_dropoff_not_ready"
    ]);
    expect(evaluateRuntimeResourceService(requirement, {
      ...variant,
      checkpoints: [first, { ...variant.checkpoints[1], appliedCommands: [] }]
    })).toEqual(["resource_service_command_not_applied"]);
    expect(evaluateRuntimeResourceService(requirement, {
      ...variant,
      checkpoints: [{ ...first, resourceServiceActors: [remote] }]
    })).toEqual(["resource_service_source_not_observed"]);
  });

  test("rejects unneeded local construction in the served paired control", () => {
    const served = { ...first, resourceServiceActors: [source, remote, local] };
    const variant = {
      presetFixtureId: "served-forest-control",
      presetCreatedActorNames: ["Tree1", "WorkMill"],
      resourceServiceBranch: "served_control" as const,
      checkpoints: [served, { ...served, tick: 500 }]
    };
    expect(evaluateRuntimeResourceService(requirement, variant)).toEqual([]);
    expect(evaluateRuntimeResourceService(requirement, {
      ...variant,
      checkpoints: [served, { ...served, tick: 500, appliedCommands: [applied] }]
    })).toEqual(["resource_service_unneeded_command"]);
    expect(evaluateRuntimeResourceService(requirement, {
      ...variant,
      checkpoints: [served, {
        ...served,
        tick: 500,
        resourceServiceActors: [...served.resourceServiceActors, { ...local, actorId: "extra" }]
      }]
    })).toEqual(["resource_service_unneeded_duplicate"]);
  });
});
