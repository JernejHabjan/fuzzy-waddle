import { CAMPAIGN_MISSION_IDS } from "@fuzzy-waddle/probable-waffle-protocol";
import { AOTA_CAMPAIGN_CATALOG } from "../catalog/ashes-of-the-ancients-content";
import { AOTA_CAMPAIGN_PROGRESSION_REGISTRY } from "../catalog/ashes-of-the-ancients-progression";
import {
  applyCampaignMissionMastery,
  campaignLoadoutSnapshotHash,
  createInitialCampaignProfile,
  mergeCampaignProfileData
} from "./campaign-profile";

describe("campaign profile", () => {
  it("enforces the exact authored one-mission-at-a-time sequence", () => {
    const missions = AOTA_CAMPAIGN_CATALOG.chapters.flatMap((chapter) => chapter.missions);
    expect(missions.map((mission) => mission.id)).toEqual(CAMPAIGN_MISSION_IDS);
    missions.forEach((mission, index) => {
      expect(mission.prerequisites).toEqual(index === 0 ? [] : [CAMPAIGN_MISSION_IDS[index - 1]]);
    });
  });

  it("merges guest and remote claims, earliest completion, and mastery without double-crediting currency", () => {
    const left = createInitialCampaignProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
    const right = createInitialCampaignProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
    const merged = mergeCampaignProfileData(
      {
        profile: {
          ...left,
          progression: {
            ...left.progression,
            wallet: { balances: { "campaign-crystal": 3 } },
            rewardClaimIds: ["dreams:first"]
          },
          missionMastery: {
            dreams: {
              firstCompletedAt: "2026-07-20T10:00:00.000Z",
              completionCount: 2,
              bestDifficulty: "normal",
              bestDurationSeconds: 100,
              completedObjectiveIds: ["primary"]
            }
          }
        },
        completedMissions: [{ missionId: "dreams", completedAt: "2026-07-20T10:00:00.000Z" }]
      },
      {
        profile: {
          ...right,
          progression: {
            ...right.progression,
            wallet: { balances: { "campaign-crystal": 3 } },
            rewardClaimIds: ["dreams:first", "dreams:optional"]
          },
          missionMastery: {
            dreams: {
              firstCompletedAt: "2026-07-19T10:00:00.000Z",
              completionCount: 1,
              bestDifficulty: "hard",
              bestDurationSeconds: 120,
              completedObjectiveIds: ["optional"]
            }
          }
        },
        completedMissions: [{ missionId: "dreams", completedAt: "2026-07-19T10:00:00.000Z" }]
      }
    );

    expect(merged.profile.progression.wallet.balances["campaign-crystal"]).toBe(3);
    expect(merged.profile.progression.rewardClaimIds).toEqual(["dreams:first", "dreams:optional"]);
    expect(merged.completedMissions[0]?.completedAt).toBe("2026-07-19T10:00:00.000Z");
    expect(merged.profile.missionMastery.dreams).toMatchObject({
      completionCount: 2,
      bestDifficulty: "hard",
      bestDurationSeconds: 100,
      completedObjectiveIds: ["optional", "primary"]
    });
  });

  it("tracks mastery maxima and stable loadout identity", () => {
    const profile = createInitialCampaignProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
    const updated = applyCampaignMissionMastery(
      profile,
      {
        runId: "run-1",
        missionId: "dreams",
        missionRevision: 1,
        baseProfileRevision: 0,
        discoveredRewardIds: [],
        completedObjectiveIds: ["primary"],
        difficulty: "hard",
        outcome: "victory",
        replayPlayback: false,
        integrity: { eligibleForRewards: true, invalidationReasons: [] }
      },
      "2026-07-20T10:00:00.000Z",
      90
    );

    expect(updated.missionMastery.dreams).toMatchObject({ completionCount: 1, bestDifficulty: "hard" });
    expect(campaignLoadoutSnapshotHash(3, ["b", "a"])).toBe(campaignLoadoutSnapshotHash(3, ["a", "b"]));
  });
});
