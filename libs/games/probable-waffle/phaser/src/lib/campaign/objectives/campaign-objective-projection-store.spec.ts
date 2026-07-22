import {
  asCampaignContentId,
  AOTA_CAMPAIGN_MISSIONS,
  createCampaignMissionRuntimeState,
  type CampaignMissionContent,
  type MissionDialogueBundle,
  type MissionObjectiveDefinition
} from "@fuzzy-waddle/probable-waffle-campaign";
import { CampaignFaction, type ProbableWaffleMapEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import { CampaignObjectiveProjectionStore } from "./campaign-objective-projection-store";

const id = asCampaignContentId;

describe("CampaignObjectiveProjectionStore", () => {
  it("rebuilds after HUD restart without replaying objective notifications", () => {
    const definition: MissionObjectiveDefinition = {
      id: id("survive"),
      kind: "primary",
      titleTextId: id("survive-title"),
      reveal: { kind: "always" },
      complete: { kind: "never" },
      display: { announceReveal: true, announceCompletion: true, showInTracker: true }
    };
    const state = createCampaignMissionRuntimeState("ashes-of-the-ancients", mission(definition));
    state.objectives["survive"]!.status = "active";
    state.objectives["survive"]!.announcedStatuses.push("active");
    const first = new CampaignObjectiveProjectionStore([definition], dialogue(), state, "keyboard-mouse");
    const notifications = jest.fn();
    first.notifications$.subscribe(notifications);

    first.rebuild(JSON.parse(JSON.stringify(state)));
    expect(first.projection.tracker[0]?.title).toBe("Survive");
    expect(notifications).not.toHaveBeenCalled();

    first.presentEffects([
      {
        tick: 1,
        kind: "objective-changed",
        sourceId: "survive",
        detail: {
          kind: "status",
          previousStatus: "hidden",
          status: "active",
          earlyCompleted: false,
          announce: true,
          checklistChanges: []
        }
      }
    ]);
    expect(notifications).toHaveBeenCalledWith(expect.objectContaining({ text: "Objective added: Survive" }));
    first.destroy();

    const restarted = new CampaignObjectiveProjectionStore([definition], dialogue(), state, "touch");
    const restartedNotifications = jest.fn();
    restarted.notifications$.subscribe(restartedNotifications);
    expect(restarted.projection.tracker).toHaveLength(1);
    expect(restartedNotifications).not.toHaveBeenCalled();
    restarted.destroy();
  });
});

function dialogue(): MissionDialogueBundle {
  return {
    schemaVersion: 1,
    missionId: "dreams",
    texts: [{ id: id("survive-title"), text: "Survive" }],
    speakers: [],
    lines: [],
    cinematics: []
  };
}

function mission(objective: MissionObjectiveDefinition): CampaignMissionContent {
  return {
    schemaVersion: 1,
    id: "dreams",
    chapterId: "prologue",
    revision: 1,
    mapId: 1 as ProbableWaffleMapEnum,
    prerequisites: [],
    catalogue: {
      order: 1,
      title: "Test",
      faction: CampaignFaction.Tivara,
      environment: "test",
      briefing: "test",
      objectiveSummaries: []
    },
    implementation: AOTA_CAMPAIGN_MISSIONS[0]!.implementation,
    participants: [],
    progressionAllowance: { loadoutSlotCount: 0 },
    initialState: { activePhaseIds: [], facts: [], counters: [], timers: [] },
    phases: [],
    objectives: [objective],
    checkpoints: [],
    difficulty: { story: {}, normal: {}, hard: {} },
    contentStatus: "skeleton"
  };
}
