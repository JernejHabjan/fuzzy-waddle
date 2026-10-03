import { CampaignKindRegistry } from "./campaign-kind-registry";
import type { CampaignRegistryRegistration } from "./campaign-registry-registration";

describe("CampaignKindRegistry", () => {
  it("resolves registered kinds without a parser switch", () => {
    const registry = new CampaignKindRegistry<"alpha" | "beta", CampaignRegistryRegistration<"alpha" | "beta">>();
    const registration = { kind: "alpha", description: "Alpha test registration" } as const;
    registry.register(registration);

    expect(registry.getRequired("alpha")).toBe(registration);
    expect(registry.kinds()).toEqual(["alpha"]);
  });

  it("rejects duplicate registrations with the stable kind", () => {
    const registry = new CampaignKindRegistry<"alpha", CampaignRegistryRegistration<"alpha">>();
    registry.register({ kind: "alpha", description: "First" });

    expect(() => registry.register({ kind: "alpha", description: "Second" })).toThrow(
      "Campaign registry kind 'alpha' is already registered"
    );
  });
});
