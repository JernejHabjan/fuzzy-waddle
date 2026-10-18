import type { ProbableWaffleReplayData } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  AOTA_CAMPAIGN_PROGRESSION_REGISTRY,
  ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
  createCampaignMissionProgressionSnapshot,
  createCampaignMissionRuntimeState,
  createInitialCampaignProgressionProfile
} from "@fuzzy-waddle/probable-waffle-campaign";
import { campaignReplayCompatibilityError } from "./replay-playback.service";

describe("campaign replay compatibility", () => {
  const content = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission("dreams");
  const progression = createCampaignMissionProgressionSnapshot(
    {
      profile: createInitialCampaignProgressionProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY),
      selectedLoadoutIds: [],
      allowance: content.progressionAllowance
    },
    AOTA_CAMPAIGN_PROGRESSION_REGISTRY
  );
  const mission = createCampaignMissionRuntimeState(ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID, content, undefined, progression);
  const replay: ProbableWaffleReplayData = {
    version: "2",
    compatibilityVersion: "campaign-lockstep-v2",
    seed: 1,
    players: [],
    commands: [],
    campaignMissionInitialState: mission,
    randomInitialState: { schemaVersion: 1, generatorState: "!rnd,1,0.1,0.2,0.3", operationCount: 0 },
    campaignContext: {
      campaignId: ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
      missionId: "dreams",
      missionRevision: content.revision,
      difficulty: "normal",
      progressionSnapshot: progression
    }
  };

  it("accepts matching content, progression, mission, and RNG identity", () => {
    expect(campaignReplayCompatibilityError(replay, content.revision)).toBeUndefined();
  });

  it("reports incompatible content revisions and missing RNG state", () => {
    expect(campaignReplayCompatibilityError(replay, content.revision + 1)).toContain("incompatible");
    expect(campaignReplayCompatibilityError({ ...replay, randomInitialState: undefined }, content.revision)).toContain(
      "random state is missing"
    );
  });
});
