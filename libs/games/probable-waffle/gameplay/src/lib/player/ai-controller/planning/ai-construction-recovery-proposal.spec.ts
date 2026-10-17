import { ObjectNames, OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { catalog, completedOpeningState } from "./ai-macro-test-fixtures";
import { AiMacroManager } from "./ai-macro-manager";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";

function fixture() {
  const worker = {
    ...createAiTestOwnedActor("worker"),
    activeOrder: { status: "known" as const, value: null, observedTick: 20 }
  };
  const site = {
    ...createAiTestOwnedActor("abandoned-house"),
    objectName: ObjectNames.Olival,
    constructionProgress: { status: "known" as const, value: 0, observedTick: 20 }
  };
  const capabilities = {
    ...catalog,
    entries: catalog.entries.map((entry) =>
      entry.sourceObjectName === ObjectNames.Olival
        ? {
            ...entry,
            constructionProfile: {
              resourceCost: {},
              footprintRadiusTiles: 0,
              visionRange: null,
              navigableHeight: null,
              enterHeight: null,
              exitHeight: null,
              requiresAssignedBuilder: true
            }
          }
        : entry
    )
  };
  const state = completedOpeningState();
  const actors: AiObservedActorV1[] = [worker, site];
  const world = { ...createAiTestObservation(), actors };
  return { worker, site, capabilities, state, world, manager: new AiMacroManager(() => capabilities) };
}

describe("unfinished construction after the opening", () => {
  it("reassigns a builder without paying or placing another house", () => {
    const f = fixture();
    const proposal = f.manager.propose(f.world, f.state);
    const resume = proposal.intents.find((intent) => intent.kind === "resume_construct");
    expect(resume).toMatchObject({ actorIds: ["worker"], targetActorId: "abandoned-house" });
    expect(resume?.claims.some((claim) => claim.kind === "resource")).toBe(false);
    expect(
      proposal.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Olival)
    ).toBe(false);
    expect(
      proposal.intents.some((intent) => intent.kind === "assign_gatherers" && intent.actorIds.includes("worker"))
    ).toBe(false);
  });

  it.each(["assigned", "loaded", "busy", "automatic", "finished"] as const)("preserves %s ownership", (boundary) => {
    const f = fixture();
    if (boundary === "assigned")
      f.world.actors[0] = {
        ...f.worker,
        activeOrder: {
          status: "known",
          value: { orderType: OrderType.Build, targetActorId: f.site.actorId },
          observedTick: 20
        }
      };
    if (boundary === "loaded") f.world.actors[0] = { ...f.worker, carriedResourceAmount: 2 };
    if (boundary === "busy") f.world.actors[0] = { ...f.worker, resourceTransferInFlight: true };
    if (boundary === "automatic")
      f.capabilities.entries = f.capabilities.entries.map((entry) =>
        entry.constructionProfile
          ? { ...entry, constructionProfile: { ...entry.constructionProfile, requiresAssignedBuilder: false } }
          : entry
      );
    if (boundary === "finished")
      f.world.actors[1] = { ...f.site, constructionProgress: { status: "known", value: 100, observedTick: 20 } };
    expect(f.manager.propose(f.world, f.state).intents.some((intent) => intent.kind === "resume_construct")).toBe(
      false
    );
  });
});
