import { asCampaignContentId } from "@fuzzy-waddle/probable-waffle-campaign";
import { CampaignTrustedHookRegistry } from "./campaign-trusted-hook-registry";

describe("CampaignTrustedHookRegistry", () => {
  it("requires one explicit executor per hook id", () => {
    const registry = new CampaignTrustedHookRegistry();
    const executor = {
      hookId: asCampaignContentId<"mission-trusted-hook">("open-secret-door"),
      execute: () => ({ status: "completed" as const })
    };
    registry.register(executor);

    expect(registry.get(executor.hookId)).toBe(executor);
    expect(registry.kinds()).toEqual(["open-secret-door"]);
    expect(() => registry.register(executor)).toThrow("already registered");
  });
});
