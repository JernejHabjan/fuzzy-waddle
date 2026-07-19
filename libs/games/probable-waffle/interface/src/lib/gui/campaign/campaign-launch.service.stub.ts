import type { CampaignMissionDefinition } from "@fuzzy-waddle/probable-waffle-protocol";
import { CampaignLaunchServiceInterface } from "./campaign-launch.service.interface";

export class CampaignLaunchServiceStub extends CampaignLaunchServiceInterface {
  startedMission?: CampaignMissionDefinition;
  override async startMission(mission: CampaignMissionDefinition): Promise<void> {
    this.startedMission = mission;
  }
}
