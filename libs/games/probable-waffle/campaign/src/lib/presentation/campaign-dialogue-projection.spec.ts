import type { CampaignMissionRuntimeState } from "@fuzzy-waddle/probable-waffle-protocol";
import { asCampaignContentId } from "../contracts/campaign-content-id";
import type { MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";
import { buildCampaignDialogueProjection, searchCampaignDialogueLog } from "./campaign-dialogue-projection";

const id = asCampaignContentId;

describe("campaign dialogue projection", () => {
  it("projects active subtitles, searchable history, and a missing-portrait fallback", () => {
    const state = runtimeState();
    state.dialoguePresentations["mission:intro"] = {
      lineId: "greeting",
      ownerToken: "mission:intro",
      status: "presenting",
      startedAtTick: 3,
      updatedAtTick: 3
    };
    state.dialogueHistory.push({ sequence: 1, tick: 3, lineId: "greeting", ownerToken: "mission:intro" });

    const projection = buildCampaignDialogueProjection(dialogue(), state);

    expect(projection.active[0]).toMatchObject({
      speakerName: "Tivara Scout",
      text: "The path is clear.",
      portraitFallback: "Tivara Scout"
    });
    expect(projection.active[0]?.portrait).toBeUndefined();
    expect(searchCampaignDialogueLog(projection.log, "PATH")).toHaveLength(1);
    expect(searchCampaignDialogueLog(projection.log, "missing")).toEqual([]);
  });
});

function dialogue(): MissionDialogueBundle {
  return {
    schemaVersion: 1,
    missionId: "dreams",
    texts: [{ id: id("scout-name"), text: "Tivara Scout" }],
    speakers: [{ id: id("scout"), nameTextId: id("scout-name"), portraitId: id("missing-portrait") }],
    lines: [
      {
        id: id("greeting"),
        speakerId: id("scout"),
        textId: id("greeting-text"),
        text: "The path is clear.",
        delivery: "blocking"
      }
    ],
    cinematics: []
  };
}

function runtimeState(): CampaignMissionRuntimeState {
  return {
    schemaVersion: 4,
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
    objectives: {},
    missionMessageHistory: [],
    dialoguePresentations: {},
    dialogueHistory: [],
    cinematics: {},
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
