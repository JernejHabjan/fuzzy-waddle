import { CampaignServerService } from "./campaign.service";
import type { SupabaseProviderService } from "@fuzzy-waddle/api/core/supabase-provider/supabase-provider.service";

describe("CampaignServerService", () => {
  it("records an owner-scoped victory and completion", async () => {
    const runs = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(async () => ({ data: { id: "run-1", mission_id: "dreams", outcome: null }, error: null })),
      update: jest.fn().mockReturnThis()
    };
    const progress = { upsert: jest.fn(async () => ({ error: null })) };
    const provider = {
      supabaseClient: { from: jest.fn((name: string) => (name.includes("runs") ? runs : progress)) }
    } as unknown as SupabaseProviderService;
    const service = new CampaignServerService(provider);

    await service.result("owner-1", { runId: "run-1", missionId: "dreams", outcome: "victory" });

    expect(runs.eq).toHaveBeenCalledWith("user_id", "owner-1");
    expect(progress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "owner-1", mission_id: "dreams" }),
      { onConflict: "user_id,mission_id" }
    );
  });
});
