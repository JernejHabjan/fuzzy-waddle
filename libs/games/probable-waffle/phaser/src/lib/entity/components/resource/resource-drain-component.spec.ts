import { campaignEconomyAcceptsGatheredResources } from "./resource-drain-component";

describe("campaign economy resource collection", () => {
  it("credits gathered resources only to normal economies", () => {
    expect(campaignEconomyAcceptsGatheredResources(undefined)).toBe(true);
    expect(campaignEconomyAcceptsGatheredResources("normal")).toBe(true);
    expect(campaignEconomyAcceptsGatheredResources("granted")).toBe(false);
    expect(campaignEconomyAcceptsGatheredResources("none")).toBe(false);
  });
});
