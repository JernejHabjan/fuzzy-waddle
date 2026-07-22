import { AOTA_CAMPAIGN_CONTENT_REGISTRY, ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID } from "../catalog/ashes-of-the-ancients-content";
import {
  createCampaignMissionRuntimeState,
  serializeCampaignMissionRuntimeStateFamilies
} from "./campaign-mission-runtime";

describe("campaign mission state family serialization", () => {
  it("ignores record insertion order", () => {
    const state = createCampaignMissionRuntimeState(
      ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
      AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission("dreams")
    );
    state.facts = { beta: true, alpha: false };
    const first = serializeCampaignMissionRuntimeStateFamilies(state);
    state.facts = { alpha: false, beta: true };
    expect(serializeCampaignMissionRuntimeStateFamilies(state)).toEqual(first);
  });

  it("isolates deterministic divergence into named diagnostic families", () => {
    const state = createCampaignMissionRuntimeState(
      ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
      AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission("dreams")
    );
    const baseline = serializeCampaignMissionRuntimeStateFamilies(state);
    state.counters["test"] = 1;
    expect(serializeCampaignMissionRuntimeStateFamilies(state).factsCountersTimers).not.toBe(
      baseline.factsCountersTimers
    );
    state.claimedTriggerIds.push("test-trigger");
    expect(serializeCampaignMissionRuntimeStateFamilies(state).triggersActions).not.toBe(baseline.triggersActions);
    state.claimedRewardIds.push("test-reward");
    expect(serializeCampaignMissionRuntimeStateFamilies(state).rewardsIntegrity).not.toBe(
      baseline.rewardsIntegrity
    );
  });
});
