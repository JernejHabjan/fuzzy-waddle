import Phaser from "phaser";
import { SimulationPauseReason, SimulationTickService } from "./simulation-tick.service";

describe("SimulationTickService campaign cinematic pause ownership", () => {
  it("removes only the cinematic pause reason when presentation completes", () => {
    const scene = {
      events: { on: jest.fn(), once: jest.fn() }
    } as unknown as Phaser.Scene;
    const service = new SimulationTickService(scene);

    service.pauseTick(SimulationPauseReason.Player);
    service.pauseTick(SimulationPauseReason.CampaignCinematic);
    expect(service.getPauseReasons()).toEqual([SimulationPauseReason.CampaignCinematic, SimulationPauseReason.Player]);

    service.resumeTick(SimulationPauseReason.CampaignCinematic);
    expect(service.isPaused).toBe(true);
    expect(service.getPauseReasons()).toEqual([SimulationPauseReason.Player]);
  });
});
