import {
  CampaignInputPromptRegistry,
  createDefaultCampaignInputPromptRegistry,
  DEFAULT_CAMPAIGN_INPUT_PROMPTS
} from "./campaign-input-prompt-registry";

describe("CampaignInputPromptRegistry", () => {
  it("registers every foundational semantic action and rejects duplicates", () => {
    const registry = createDefaultCampaignInputPromptRegistry();
    expect(registry.actions()).toEqual(DEFAULT_CAMPAIGN_INPUT_PROMPTS.map((prompt) => prompt.action).sort());

    const duplicate = new CampaignInputPromptRegistry();
    duplicate.register(DEFAULT_CAMPAIGN_INPUT_PROMPTS[0]!);
    expect(() => duplicate.register(DEFAULT_CAMPAIGN_INPUT_PROMPTS[0]!)).toThrow("already registered");
  });
});
