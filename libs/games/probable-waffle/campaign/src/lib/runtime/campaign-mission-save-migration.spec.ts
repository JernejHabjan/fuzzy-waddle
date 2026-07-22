import { createCampaignMissionRuntimeState } from "./campaign-mission-runtime";
import { migrateCampaignMissionRevision } from "./campaign-mission-save-migration";
import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID
} from "../catalog/ashes-of-the-ancients-content";

describe("migrateCampaignMissionRevision", () => {
  it("applies an explicit revision chain and identifier renames", () => {
    const state = createCampaignMissionRuntimeState(
      ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
      AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission("dreams")
    );
    state.missionRevision = 1;
    state.activePhaseIds = ["old-phase"];
    state.facts = { "old-fact": true };

    const migrated = migrateCampaignMissionRevision(state, 3, [
      { fromRevision: 1, toRevision: 2, renamePhaseIds: { "old-phase": "middle-phase" } },
      {
        fromRevision: 2,
        toRevision: 3,
        renamePhaseIds: { "middle-phase": "new-phase" },
        renameFactIds: { "old-fact": "new-fact" }
      }
    ]);

    expect(migrated?.missionRevision).toBe(3);
    expect(migrated?.activePhaseIds).toEqual(["new-phase"]);
    expect(migrated?.facts).toEqual({ "new-fact": true });
  });

  it("rejects a revision without a fully declared chain", () => {
    const state = createCampaignMissionRuntimeState(
      ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
      AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission("dreams")
    );
    state.missionRevision = 1;
    expect(migrateCampaignMissionRevision(state, 2, [])).toBeUndefined();
  });
});
