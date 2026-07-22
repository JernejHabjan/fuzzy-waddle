import { CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignMissionRuntimeState } from "@fuzzy-waddle/probable-waffle-protocol";
import { asCampaignContentId } from "../../contracts/campaign-content-id";
import { CAMPAIGN_CONDITION_KINDS } from "../../contracts/campaign-content-kinds";
import {
  CampaignConditionEvaluatorRegistry,
  CampaignConditionRuntime,
  createCampaignConditionEvaluatorRegistry
} from "./campaign-condition-evaluator";

const id = asCampaignContentId;

describe("campaign condition runtime", () => {
  it("registers every leaf condition kind and rejects duplicates", () => {
    const registry = createCampaignConditionEvaluatorRegistry({ evaluate: () => true });
    expect(registry.kinds()).toEqual(
      CAMPAIGN_CONDITION_KINDS.filter((kind) => kind !== "all" && kind !== "any" && kind !== "not").sort()
    );
    const duplicates = new CampaignConditionEvaluatorRegistry();
    const evaluator = { kind: "always" as const, evaluate: () => true };
    duplicates.register(evaluator);
    expect(() => duplicates.register(evaluator)).toThrow("already registered");
  });

  it("composes pure state and delegated world reads without mutating state", () => {
    const state = runtimeState();
    state.facts["ready"] = true;
    const before = structuredClone(state);
    const adapter = { evaluate: jest.fn(() => true) };
    const runtime = new CampaignConditionRuntime(createCampaignConditionEvaluatorRegistry(adapter));

    expect(
      runtime.evaluate(
        { state },
        {
          kind: "all",
          conditions: [
            { kind: "fact", factId: id("ready"), equals: true },
            { kind: "actor-exists", actorId: id("hero") }
          ]
        }
      )
    ).toBe(true);
    expect(adapter.evaluate).toHaveBeenCalledWith({ state }, { kind: "actor-exists", actorId: "hero" });
    expect(state).toEqual(before);
  });

  it("reads checklist state without mutating objective state", () => {
    const state = runtimeState();
    state.objectives["survive"] = {
      status: "active",
      updatedAtTick: 1,
      earlyCompleted: false,
      announcedStatuses: ["active"],
      checklist: { "hold-line": { status: "completed", updatedAtTick: 2 } }
    };
    const runtime = new CampaignConditionRuntime(createCampaignConditionEvaluatorRegistry());

    expect(
      runtime.evaluate(
        { state },
        {
          kind: "objective-checklist",
          objectiveId: id("survive"),
          checklistId: id("hold-line"),
          state: "completed"
        }
      )
    ).toBe(true);
  });

  it("reads mission-local quest item counts from synchronized state", () => {
    const state = runtimeState();
    state.missionItems = { wool: 2 };
    const runtime = new CampaignConditionRuntime(createCampaignConditionEvaluatorRegistry());

    expect(
      runtime.evaluate(
        { state },
        { kind: "mission-item-count", itemId: "wool", comparison: "greater-or-equal", value: 2 }
      )
    ).toBe(true);
  });
});

function runtimeState(): CampaignMissionRuntimeState {
  return {
    schemaVersion: CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
    campaignId: "ashes-of-the-ancients",
    missionId: "dreams",
    missionRevision: 1,
    status: "running",
    initialized: true,
    activePhaseIds: ["test"],
    completedPhaseIds: [],
    pendingPhaseIds: [],
    facts: {},
    counters: {},
    timers: {},
    objectives: {},
    missionMessageHistory: [],
    dialoguePresentations: {},
    dialogueHistory: [],
    cinematics: {},
    participantTeams: {},
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
