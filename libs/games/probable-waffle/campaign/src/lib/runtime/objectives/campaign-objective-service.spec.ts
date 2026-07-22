import {
  CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
  type CampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";
import { asCampaignContentId } from "../../contracts/campaign-content-id";
import type { MissionObjectiveDefinition } from "../../contracts/mission-objective-definition";
import { createObjectiveRuntimeState, DefaultCampaignObjectiveService } from "./campaign-objective-service";

const id = asCampaignContentId;

describe("DefaultCampaignObjectiveService", () => {
  it.each([
    ["primary", "completed"],
    ["secondary", "failed"],
    ["optional", "impossible"],
    ["hidden", "completed"],
    ["tutorial", "completed"],
    ["failure", "failed"]
  ] as const)("supports %s objective transitions to %s", (kind, terminalState) => {
    const definition = objective(`test-${kind}`, kind);
    const state = runtimeState([definition]);
    const service = new DefaultCampaignObjectiveService(state, [definition]);

    service.reveal(definition.id, 1);
    if (terminalState === "completed") service.complete(definition.id, 2);
    else if (terminalState === "failed") service.fail(definition.id, 2, id("test-reason"));
    else service.markImpossible(definition.id, 2);

    expect(service.getState(definition.id)).toMatchObject({
      status: terminalState,
      revealedAtTick: 1,
      updatedAtTick: 2,
      announcedStatuses: ["active", terminalState]
    });
    expect(state.missionMessageHistory.map((entry) => entry.state)).toEqual(["active", terminalState]);
  });

  it("records early completion without leaking an unrevealed objective first", () => {
    const definition = objective("secret", "hidden", {
      reveal: { kind: "never" },
      complete: { kind: "fact", factId: id("secret-found"), equals: true }
    });
    const state = runtimeState([definition]);
    state.facts["secret-found"] = true;
    const service = new DefaultCampaignObjectiveService(state, [definition]);

    service.evaluate(3, { evaluate: (condition) => condition.kind === "fact" });

    expect(service.getState(definition.id)).toMatchObject({
      status: "completed",
      earlyCompleted: true,
      completedAtTick: 3,
      announcedStatuses: ["completed"]
    });
  });

  it("tracks checklist counters across restore and completes dependencies in stable order", () => {
    const first = objective("collect", "tutorial", {
      complete: {
        kind: "objective-checklist",
        objectiveId: id("collect"),
        checklistId: id("collect-three"),
        state: "completed"
      },
      checklist: [
        {
          id: id("collect-three"),
          textId: id("collect-three-text"),
          complete: { kind: "counter", counterId: id("items"), comparison: "greater-or-equal", value: 3 },
          progress: { counterId: id("items"), target: 3, display: "count" }
        }
      ]
    });
    const second = objective("return", "primary", { dependsOnObjectiveIds: [first.id] });
    const state = runtimeState([first, second]);
    state.counters["items"] = 2;
    const evaluate = (condition: MissionObjectiveDefinition["complete"]): boolean =>
      condition.kind === "always" ||
      (condition.kind === "counter" && (state.counters[condition.counterId] ?? 0) >= condition.value);
    const service = new DefaultCampaignObjectiveService(state, [first, second]);
    service.evaluate(1, { evaluate });
    expect(state.objectives["collect"]?.checklist["collect-three"]).toMatchObject({ current: 2, target: 3 });

    const restored = structuredClone(state);
    restored.counters["items"] = 3;
    const restoredService = new DefaultCampaignObjectiveService(restored, [first, second]);
    restoredService.evaluate(2, {
      evaluate: (condition) =>
        condition.kind === "always" ||
        condition.kind === "counter" ||
        (condition.kind === "objective-checklist" &&
          restored.objectives[condition.objectiveId]?.checklist[condition.checklistId]?.status === condition.state)
    });

    expect(restored.objectives["collect"]?.checklist["collect-three"]?.status).toBe("completed");
    expect(restored.objectives["return"]?.status).toBe("active");
  });

  it("produces one shared deterministic state for equivalent co-op participant contexts", () => {
    const definition = objective("shared", "primary");
    const left = runtimeState([definition]);
    const right = structuredClone(left);
    new DefaultCampaignObjectiveService(left, [definition]).evaluate(5, { evaluate: () => true });
    new DefaultCampaignObjectiveService(right, [definition]).evaluate(5, { evaluate: () => true });

    expect(right.objectives).toEqual(left.objectives);
    expect(right.missionMessageHistory).toEqual(left.missionMessageHistory);
  });
});

function objective(
  objectiveId: string,
  kind: MissionObjectiveDefinition["kind"],
  overrides: Partial<MissionObjectiveDefinition> = {}
): MissionObjectiveDefinition {
  return {
    id: id(objectiveId),
    kind,
    titleTextId: id(`${objectiveId}-title`),
    reveal: { kind: "always" },
    complete: { kind: "never" },
    display: { announceReveal: true, announceCompletion: true, showInTracker: true },
    ...overrides
  };
}

function runtimeState(definitions: readonly MissionObjectiveDefinition[]): CampaignMissionRuntimeState {
  return {
    schemaVersion: CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
    campaignId: "ashes-of-the-ancients",
    missionId: "dreams",
    missionRevision: 1,
    status: "running",
    initialized: true,
    activePhaseIds: [],
    completedPhaseIds: [],
    pendingPhaseIds: [],
    facts: {},
    counters: {},
    timers: {},
    objectives: Object.fromEntries(
      definitions.map((definition) => [definition.id, createObjectiveRuntimeState(definition)])
    ),
    missionMessageHistory: [],
    encounters: {},
    claimedTriggerIds: [],
    triggerStates: {},
    claimedRewardIds: [],
    pendingEvents: [],
    actionContinuations: {},
    ownedResources: {},
    integrity: {
      lastProcessedTick: 0,
      lastQueuedEventSequence: 0,
      processedActionCount: 0,
      processedTransitionCount: 0,
      lastTickActionCount: 0,
      lastTickTransitionCount: 0,
      outcomeDispatched: false,
      recentTrace: []
    }
  };
}
