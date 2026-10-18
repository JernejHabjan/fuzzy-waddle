import { isCampaignAiTargetVisible } from "./world-state-snapshot-manager";

describe("campaign AI visibility", () => {
  it("uses deterministic logical distance from the base and owned vision sources", () => {
    expect(isCampaignAiTargetVisible({ x: 3, y: 4, z: 0 }, [], { x: 0, y: 0, z: 0 }, 5)).toBe(true);
    expect(isCampaignAiTargetVisible({ x: 12, y: 10, z: 0 }, [{ x: 10, y: 10, z: 2 }], undefined, 2)).toBe(true);
    expect(isCampaignAiTargetVisible({ x: 13, y: 10, z: 0 }, [{ x: 10, y: 10, z: 2 }], undefined, 2)).toBe(false);
  });
});
