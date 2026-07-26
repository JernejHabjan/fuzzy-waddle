import type { CampaignRewardCommitResult } from "@fuzzy-waddle/probable-waffle-protocol";
import { asCampaignContentId } from "../contracts/campaign-content-id";
import type { MissionRewardBundle } from "../contracts/mission-reward-bundle";
import { createInitialCampaignProgressionProfile } from "../progression/campaign-progression-resolver";
import { AOTA_CAMPAIGN_PROGRESSION_REGISTRY } from "../catalog/ashes-of-the-ancients-progression";
import { projectCampaignRewardSummary } from "./campaign-reward-summary-projection";

describe("projectCampaignRewardSummary", () => {
  it("reveals earned hidden rewards while leaving undiscovered hidden content absent", () => {
    const bundle: MissionRewardBundle = {
      schemaVersion: 1,
      missionId: "dreams",
      rewards: [
        {
          id: asCampaignContentId("found-secret"),
          kind: "currency",
          titleTextId: asCampaignContentId("found-secret-title"),
          scope: { kind: "global" },
          oneTime: true,
          hidden: true,
          currencyId: "campaign-crystal",
          amount: 1
        },
        {
          id: asCampaignContentId("unknown-secret"),
          kind: "currency",
          titleTextId: asCampaignContentId("unknown-secret-title"),
          scope: { kind: "global" },
          oneTime: true,
          hidden: true,
          currencyId: "campaign-crystal",
          amount: 1
        }
      ]
    };
    const result: CampaignRewardCommitResult = {
      runId: "run-1",
      status: "committed",
      profile: createInitialCampaignProgressionProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY),
      appliedRewardIds: ["found-secret"],
      skippedRewardIds: [],
      warnings: []
    };

    expect(projectCampaignRewardSummary(bundle, result).entries).toEqual([
      {
        rewardId: "found-secret",
        titleTextId: "found-secret-title",
        kind: "currency",
        status: "earned"
      }
    ]);
  });
});
