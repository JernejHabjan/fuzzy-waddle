import type { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { CampaignMissionDirector, type CampaignMissionOutcomeHandler } from "./campaign-mission-director";

describe("CampaignMissionDirector", () => {
  it("does not register or mutate state without campaign context", () => {
    const scene = {
      baseGameData: {
        gameInstance: {
          gameInstanceMetadata: { data: {} },
          gameState: { data: {} }
        }
      }
    } as unknown as ProbableWaffleScene;
    const outcomeHandler: CampaignMissionOutcomeHandler = {
      resolveCampaignMissionOutcome: jest.fn()
    };

    expect(CampaignMissionDirector.create(scene, outcomeHandler)).toBeUndefined();
    expect(scene.baseGameData.gameInstance.gameState?.data.campaignMission).toBeUndefined();
    expect(outcomeHandler.resolveCampaignMissionOutcome).not.toHaveBeenCalled();
  });
});
