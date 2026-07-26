import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
  createCampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-campaign";
import { validateCampaignRestore } from "./campaign-restore-coordinator";

describe("validateCampaignRestore", () => {
  const content = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission("dreams");
  const context = {
    campaignId: ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
    catalogVersion: 1,
    chapterId: "prologue" as const,
    missionId: "dreams" as const,
    missionRevision: content.revision,
    runId: "run-1"
  };

  it("accepts matching campaign runtime identities and content identifiers", () => {
    const runtime = createCampaignMissionRuntimeState(ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID, content);
    expect(validateCampaignRestore(context, runtime).status).toBe("valid");
  });

  it("keeps a restore invalid when persisted identifiers no longer exist", () => {
    const runtime = createCampaignMissionRuntimeState(ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID, content);
    runtime.activePhaseIds = ["removed-phase"];
    const report = validateCampaignRestore(context, runtime);
    expect(report.status).toBe("invalid");
    expect(report.issues).toContain("Mission phase 'removed-phase' is no longer defined.");
    expect(report.recoveryOptions).toContain("earlier-autosave");
  });
});
