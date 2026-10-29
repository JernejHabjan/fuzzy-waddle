import { expect, test } from "@playwright/test";
import { hasCurrentVisibleTowerObservation } from "./skirmish-ai-expansion-world-evaluation";
import { isNativeBuilderAssignedToSite } from "./skirmish-ai-expansion-service-evaluation";
import { expansionEffectMatchesExecution } from "./skirmish-ai-expansion-service-evaluation";

test("matches the accepted expansion effect to its native command lineage", () => {
  expect(expansionEffectMatchesExecution("effect:expansion:1", { effectId: "expansion:1" })).toBe(true);
  expect(expansionEffectMatchesExecution("effect:expansion:1", { effectId: "expansion:2" })).toBe(false);
  expect(expansionEffectMatchesExecution("effect:expansion:1", undefined)).toBe(false);
});

test("requires the original owned builder's known native Build order for the exact site", () => {
  const builder = { actorId: "builder", relation: "self", logicalPosition: { status: "known" },
    activeOrder: { status: "known", observedTick: 120,
      value: { orderType: "Build", targetActorId: "site" } } };
  expect(isNativeBuilderAssignedToSite(builder, "builder", "site", 120)).toBe(true);
  expect(isNativeBuilderAssignedToSite({ ...builder, actorId: "other" }, "builder", "site", 120)).toBe(false);
  expect(isNativeBuilderAssignedToSite({ ...builder, activeOrder: { ...builder.activeOrder, observedTick: 100 } }, "builder", "site", 120)).toBe(false);
  expect(isNativeBuilderAssignedToSite({ ...builder, activeOrder: { ...builder.activeOrder, value: null } }, "builder", "site", 120)).toBe(false);
});

test("only treats a tower as a live threat when the placement decision currently observes it", () => {
  const tower = { actorId: "tower", visibility: "last_seen",
    logicalPosition: { status: "known" }, combatProfile: { status: "known" } };
  const input = {
    gaps: [],
    snapshotRestoreInProgress: false,
    observation: { tick: 120, actors: [tower] }
  };
  expect(hasCurrentVisibleTowerObservation(input, 120, "tower")).toBe(false);
  expect(hasCurrentVisibleTowerObservation({ ...input, observation: { ...input.observation, tick: 119 } }, 120, "tower")).toBe(false);
  expect(hasCurrentVisibleTowerObservation({ ...input, observation: { ...input.observation, actors: [
    { ...tower, visibility: "visible" }
  ] } }, 120, "tower")).toBe(true);
});
