import { AOTA_CAMPAIGN_MISSIONS } from "@fuzzy-waddle/probable-waffle-campaign";
import { AOTA_CAMPAIGN_CONTENT_REGISTRY } from "./campaign-content";

describe("Phaser campaign content", () => {
  it("resolves the exact mission objects owned by the pure campaign library", () => {
    for (const mission of AOTA_CAMPAIGN_MISSIONS) {
      expect(AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(mission.id)).toBe(mission);
    }
  });
});
