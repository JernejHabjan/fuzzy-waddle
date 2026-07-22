import {
  CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
  type CampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";
import { asCampaignContentId } from "../../contracts/campaign-content-id";
import { CAMPAIGN_ACTION_KINDS } from "../../contracts/campaign-content-kinds";
import type {
  MissionActionDefinition,
  MissionCompositeActionDefinition
} from "../../contracts/mission-action-definition";
import {
  CampaignActionExecutorRegistry,
  CampaignActionRunner,
  createCampaignActionExecutorRegistry,
  type CampaignMissionActionContext
} from "./campaign-action-runtime";

const id = asCampaignContentId;

describe("campaign action runtime", () => {
  it("registers every reusable action kind and rejects duplicate executors", () => {
    const registry = createCampaignActionExecutorRegistry();
    expect(registry.kinds()).toEqual([...CAMPAIGN_ACTION_KINDS].sort());

    const duplicates = new CampaignActionExecutorRegistry();
    const executor = {
      kind: "set-fact" as const,
      execute: () => ({ status: "completed" as const })
    };
    duplicates.register(executor);
    expect(() => duplicates.register(executor)).toThrow("already registered");
  });

  it("cancels waiting race branches when another branch completes", () => {
    const cancelled: string[] = [];
    const releaseOwnedResources = jest.fn(() => []);
    const registry = new CampaignActionExecutorRegistry();
    registry.register({
      kind: "trusted-hook",
      execute: (_context, definition) =>
        definition.id === "waiting"
          ? {
              status: "waiting",
              continuationState: { cursor: 1 },
              ownedResources: [{ resourceId: "waiting-lock", kind: "lock" }]
            }
          : { status: "completed" },
      cancel: (_context, definition) => cancelled.push(definition.id)
    });
    const runner = new CampaignActionRunner(registry, {
      execute: () => ({ status: "completed" }),
      releaseOwnedResources
    });
    const definition: MissionCompositeActionDefinition = {
      id: id("race"),
      kind: "race",
      actions: [trustedHook("waiting"), trustedHook("winner")]
    };

    expect(runner.execute(context(), definition)).toEqual({ status: "completed" });
    expect(cancelled).toEqual(["waiting"]);
    expect(releaseOwnedResources).toHaveBeenCalledWith(
      "phase:test:direct:action",
      [{ resourceId: "waiting-lock", kind: "lock", ownerToken: "phase:test:direct:action" }],
      "race-lost"
    );
  });

  it("serializes and resumes a wait action using simulation ticks only", () => {
    const runner = new CampaignActionRunner(createCampaignActionExecutorRegistry());
    const definition: MissionActionDefinition = { id: id("wait"), kind: "wait-ticks", durationTicks: 3 };
    const initial = runner.execute(context(4), definition);
    expect(initial).toEqual({ status: "waiting", continuationState: { untilTick: 7 } });
    if (initial.status !== "waiting") throw new Error("Expected waiting action");

    expect(runner.resume(context(6), definition, initial.continuationState).status).toBe("waiting");
    expect(runner.resume(context(7), definition, initial.continuationState)).toEqual({ status: "completed" });
  });

  it("routes objective and checklist actions through the objective action port", () => {
    const objectiveActions = { setState: jest.fn(), setChecklistState: jest.fn() };
    const actionContext = { ...context(2), objectiveActions };
    const runner = new CampaignActionRunner(createCampaignActionExecutorRegistry());
    const objectiveAction = action("set-objective-state", "complete-objective", {
      objectiveId: id("survive"),
      state: "completed"
    });
    const checklistAction = action("set-objective-checklist-state", "complete-checklist", {
      objectiveId: id("survive"),
      checklistId: id("hold-line"),
      state: "completed"
    });

    runner.execute(actionContext, objectiveAction);
    runner.execute(actionContext, checklistAction);

    expect(objectiveActions.setState).toHaveBeenCalledWith(objectiveAction, 2);
    expect(objectiveActions.setChecklistState).toHaveBeenCalledWith(checklistAction, 2);
  });

  it("records explicit reward discovery once in deterministic pending state", () => {
    const actionContext = context(2);
    const runner = new CampaignActionRunner(createCampaignActionExecutorRegistry());
    const discover = action("discover-reward", "find-secret", { rewardId: id("secret-tome") });

    runner.execute(actionContext, discover);
    runner.execute(actionContext, discover);

    expect(actionContext.state.claimedRewardIds).toEqual(["secret-tome"]);
  });
});

function action<TKind extends MissionActionDefinition["kind"]>(
  kind: TKind,
  actionId: string,
  data: Omit<Extract<MissionActionDefinition, { kind: TKind }>, "id" | "kind">
): Extract<MissionActionDefinition, { kind: TKind }> {
  return { id: id(actionId), kind, ...data } as Extract<MissionActionDefinition, { kind: TKind }>;
}

function trustedHook(actionId: string): MissionActionDefinition {
  return { id: id(actionId), kind: "trusted-hook", hookId: id(`hook-${actionId}`) };
}

function context(tick = 0): CampaignMissionActionContext {
  return { tick, state: runtimeState(), ownerToken: "phase:test:direct:action", phaseId: "test" };
}

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
