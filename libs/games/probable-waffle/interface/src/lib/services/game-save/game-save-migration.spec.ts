import {
  GameSaveKind,
  GameSaveScope,
  GameSaveSyncState,
  type EncodedGameSaveRecord,
  type ProbableWaffleGameInstanceData
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
  createCampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-campaign";
import { migrateGameSaveRecord } from "./game-save-migration";

describe("migrateGameSaveRecord", () => {
  const runtime = createCampaignMissionRuntimeState(
    ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
    AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission("dreams")
  );
  const stored = {
    id: "save-1",
    formatVersion: 1,
    scope: GameSaveScope.Campaign,
    kind: GameSaveKind.Autosave,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    revision: 1,
    syncState: GameSaveSyncState.Local,
    campaign: { chapterId: "prologue", missionId: "dreams", runId: "run-1" },
    encodedGameInstanceData: "encoded"
  } as EncodedGameSaveRecord;
  const data = {
    gameInstanceMetadataData: {
      campaignContext: {
        campaignId: ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
        catalogVersion: 1,
        chapterId: "prologue",
        missionId: "dreams",
        missionRevision: 1,
        runId: "run-1"
      }
    },
    gameStateData: { campaignMission: runtime },
    players: []
  } as ProbableWaffleGameInstanceData;

  it("upgrades legacy searchable metadata from the decoded campaign runtime", () => {
    const result = migrateGameSaveRecord(stored, data);
    expect(result.status).toBe("supported");
    if (result.status !== "supported") return;
    expect(result.migrated).toBe(true);
    expect(result.record.campaign).toEqual(
      expect.objectContaining({ campaignId: ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID, runtimeSchemaVersion: runtime.schemaVersion })
    );
  });

  it("keeps unknown future formats visible for recovery", () => {
    const result = migrateGameSaveRecord({ ...stored, formatVersion: 99 }, data);
    expect(result.status).toBe("unsupported");
    if (result.status !== "unsupported") return;
    expect(result.record.compatibility.recoveryOptions).toEqual(expect.arrayContaining(["export", "delete"]));
  });
});
