import type { SupabaseProviderService } from "@fuzzy-waddle/platform-database-schema/server/supabase-provider/supabase-provider.service";
import {
  AOTA_CAMPAIGN_PROGRESSION_REGISTRY,
  createInitialCampaignProfile
} from "@fuzzy-waddle/probable-waffle-campaign";
import { CampaignServerService } from "./campaign.service";

describe("CampaignServerService", () => {
  it("migrates a completion-only account into exactly one profile", async () => {
    const progress = queryWithRows([
      { mission_id: "dreams", completed_at: "2026-07-20T10:00:00.000Z", result_metadata: {} }
    ]);
    const profiles = queryWithSingle(null);
    profiles.upsert = jest.fn(async () => ({ error: null }));
    const provider = providerFor({
      probable_waffle_campaign_progress: progress,
      probable_waffle_campaign_profiles: profiles
    });

    const result = await new CampaignServerService(provider).profile("owner-1");

    expect(result.completedMissions).toEqual([{ missionId: "dreams", completedAt: "2026-07-20T10:00:00.000Z" }]);
    expect(result.profile.missionMastery.dreams).toMatchObject({ completionCount: 1 });
    expect(profiles.upsert).toHaveBeenCalledTimes(1);
  });

  it("commits profile, mastery, claims, progress, and run result through one RPC", async () => {
    const initial = createInitialCampaignProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
    const committed = {
      ...initial,
      progression: { ...initial.progression, revision: 1 },
      committedRunIds: ["00000000-0000-4000-8000-000000000001"]
    };
    const progress = queryWithRows([]);
    const profiles = queryWithSingle({ profile_document: initial });
    profiles.maybeSingle
      .mockResolvedValueOnce({ data: { profile_document: initial }, error: null })
      .mockResolvedValueOnce({ data: { profile_document: committed }, error: null });
    const runs = queryWithSingle({
      id: "00000000-0000-4000-8000-000000000001",
      mission_id: "dreams",
      mission_revision: 1,
      base_profile_revision: 0,
      outcome: null,
      integrity: { eligibleForRewards: true, invalidationReasons: [] },
      commit_status: "pending",
      commit_result: null
    });
    const rpc = jest.fn(async () => ({ data: {}, error: null }));
    const provider = providerFor(
      {
        probable_waffle_campaign_progress: progress,
        probable_waffle_campaign_profiles: profiles,
        probable_waffle_campaign_runs: runs
      },
      rpc
    );

    const response = await new CampaignServerService(provider).result("owner-1", {
      runId: "00000000-0000-4000-8000-000000000001",
      missionId: "dreams",
      missionRevision: 1,
      baseProfileRevision: 0,
      outcome: "victory",
      completedObjectiveIds: ["primary"],
      discoveredRewardIds: [],
      difficulty: "hard",
      replayPlayback: false,
      integrity: { eligibleForRewards: true, invalidationReasons: [] }
    });

    expect(response.result.status).toBe("committed");
    expect(response.profileOwnerId).toBe("owner-1");
    expect(runs.eq).toHaveBeenCalledWith("user_id", "owner-1");
    expect(rpc).toHaveBeenCalledWith(
      "commit_probable_waffle_campaign_victory",
      expect.objectContaining({
        p_user_id: "owner-1",
        p_mission_id: "dreams",
        p_base_profile_revision: 0,
        p_profile_document: expect.objectContaining({
          progression: expect.objectContaining({ revision: 1 }),
          missionMastery: expect.objectContaining({ dreams: expect.objectContaining({ bestDifficulty: "hard" }) })
        })
      })
    );
  });
});

function queryWithRows(rows: unknown[]) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn(async () => ({ data: rows, error: null })),
    upsert: jest.fn()
  };
}

function queryWithSingle(value: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(async () => ({ data: value, error: null })),
    upsert: jest.fn(),
    update: jest.fn().mockReturnThis()
  };
}

function providerFor(tables: Record<string, unknown>, rpc = jest.fn()) {
  return {
    supabaseClient: {
      from: jest.fn((table: string) => tables[table]),
      rpc
    }
  } as unknown as SupabaseProviderService;
}
