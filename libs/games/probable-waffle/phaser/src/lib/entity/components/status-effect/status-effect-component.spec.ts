import Phaser from "phaser";
import { StatusEffectType } from "@fuzzy-waddle/probable-waffle-protocol";
import { StatusEffectComponent } from "./status-effect-component";
import { getSimulationNow } from "../../../world/services/simulation-time";

jest.mock("../../../data/game-object-helper", () => ({
  isGameObjectActiveInActiveScene: () => true,
  onObjectReady: () => undefined
}));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: () => undefined }));
jest.mock("../../../world/services/simulation-time", () => ({ getSimulationNow: jest.fn() }));

describe("StatusEffectComponent periodic refresh", () => {
  it("continues healing when a zone refreshes the effect at its tick boundary", () => {
    const actor = { scene: {}, once: jest.fn(), emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const component = new StatusEffectComponent(actor);
    const heal = jest.fn();
    const runtime = component as unknown as { healthComponent: { heal: typeof heal }; update: () => void };
    runtime.healthComponent = { heal };
    const effect = {
      type: StatusEffectType.Regenerating,
      duration: 1000,
      remainingTime: 1000,
      tickInterval: 1000,
      healPerTick: 5
    };
    const now = jest.mocked(getSimulationNow);
    now.mockReturnValue(0);
    component.applyEffect(effect);
    now.mockReturnValue(1000);
    component.applyEffect(effect);
    runtime.update();
    expect(heal).toHaveBeenCalledWith(5);
    now.mockReturnValue(2000);
    component.applyEffect(effect);
    runtime.update();
    expect(heal).toHaveBeenCalledTimes(2);
  });
});
