import { createCampaignMissionRuntimeState } from "../runtime/campaign-mission-runtime";
import { CampaignRunIntegrityService } from "./campaign-run-integrity-service";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import { AOTA_CAMPAIGN_MISSIONS } from "../catalog/ashes-of-the-ancients-content";

describe("CampaignRunIntegrityService", () => {
  it("invalidates monotonically and keeps pending discoveries synchronized with the launch snapshot", () => {
    const state = createCampaignMissionRuntimeState("ashes-of-the-ancients", mission(), undefined, {
      baseProfileRevision: 0,
      profile: {
        schemaVersion: 1,
        revision: 0,
        wallet: { balances: { crystal: 1 } },
        discoveredUpgradeIds: [],
        permanentUpgradeIds: [],
        purchasedUpgradeIds: [],
        unlockIds: [],
        heroProgress: {},
        factionProgress: {},
        loadouts: {},
        inventory: [],
        rewardClaimIds: []
      },
      effectiveLoadout: {
        selectedLoadoutIds: [],
        upgradeIds: [],
        unlockIds: [],
        inventoryItemIds: [],
        modifiers: [],
        unitLevelCaps: {},
        restrictionReasons: []
      },
      temporaryBoostIds: [],
      pendingRewardIds: []
    });
    const service = new CampaignRunIntegrityService(state);

    service.discoverReward("secret-tome");
    service.invalidate("developer-command");
    service.invalidate("developer-command");

    expect(state.progression?.pendingRewardIds).toEqual(["secret-tome"]);
    expect(service.current()).toEqual({
      eligibleForRewards: false,
      invalidationReasons: ["developer-command"]
    });
  });
});

function mission(): CampaignMissionContent {
  return {
    schemaVersion: 1,
    id: "dreams",
    chapterId: "prologue",
    revision: 1,
    mapKey: "MapEmberEnclave",
    prerequisites: [],
    catalogue: {
      order: 0,
      title: "Dreams",
      faction: "switching",
      environment: "Test",
      briefing: "Test",
      objectiveSummaries: []
    },
    implementation: AOTA_CAMPAIGN_MISSIONS[0]!.implementation,
    participants: [],
    progressionAllowance: { loadoutSlotCount: 0 },
    initialState: { activePhaseIds: [], facts: [], counters: [], timers: [] },
    phases: [],
    objectives: [],
    checkpoints: [],
    difficulty: { story: {}, normal: {}, hard: {} },
    contentStatus: "skeleton"
  };
}
