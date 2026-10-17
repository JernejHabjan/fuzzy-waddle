import Phaser from "phaser";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { PlayerAiBlackboard } from "../player-ai-blackboard";
import { EconomyManager } from "./economy-manager";
import { GATHERED_RESOURCE_CREDITED } from "../../../entity/components/resource/credit-gathered-resource";
import { getSimulationNow } from "../../../world/services/simulation-time";

jest.mock("../../../world/services/simulation-time", () => ({ getSimulationNow: jest.fn(() => 0) }));

function fixture() {
  const scene = { events: new Phaser.Events.EventEmitter() } as Phaser.Scene;
  const blackboard = {
    economy: {
      resources: { wood: 200, food: 200, stone: 200, minerals: 200 },
      incomeInstant: { wood: 0, food: 0, stone: 0, minerals: 0 },
      incomeSmoothed: { wood: 0, food: 0, stone: 0, minerals: 0 }
    }
  } as PlayerAiBlackboard;
  const manager = new EconomyManager(blackboard, scene, 2);
  const deliver = (amount: number, owner = 2) =>
    scene.events.emit(GATHERED_RESOURCE_CREDITED, owner, ResourceType.Wood, amount);
  return { scene, blackboard, manager, deliver };
}

describe("native delivered-income accounting", () => {
  beforeEach(() => jest.mocked(getSimulationNow).mockReturnValue(0));
  it("ignores starts, grants, spending and another player's receipts", () => {
    const f = fixture();
    f.blackboard.economy.resources.wood += 1000;
    f.deliver(500, 1);
    f.manager.update(5000);
    expect(f.blackboard.economy.incomeInstant.wood).toBe(0);
    f.deliver(20);
    f.blackboard.economy.resources.wood = 0;
    f.manager.update(10000);
    expect(f.blackboard.economy.incomeInstant.wood).toBe(4);
    expect(f.blackboard.economy.incomeSmoothed.wood).toBeCloseTo(0.4);
  });
  it("consumes receipts once and decays during a delivery stall", () => {
    const f = fixture();
    f.deliver(20);
    f.manager.update(4999);
    expect(f.blackboard.economy.incomeInstant.wood).toBe(0);
    f.manager.update(5000);
    f.manager.update(5000);
    f.manager.update(10000);
    expect(f.blackboard.economy.incomeInstant.wood).toBe(0);
    expect(f.blackboard.economy.incomeSmoothed.wood).toBeCloseTo(0.36);
  });
  it("resets legacy/save estimates and pending samples before counting resumed deliveries", () => {
    const f = fixture();
    f.deliver(100);
    f.blackboard.economy.incomeSmoothed.wood = 1000;
    jest.mocked(getSimulationNow).mockReturnValue(20000);
    f.manager.reset();
    f.manager.update(25000);
    expect(f.blackboard.economy.incomeSmoothed.wood).toBe(0);
    f.deliver(10);
    f.manager.update(30000);
    expect(f.blackboard.economy.incomeInstant.wood).toBe(2);
  });
  it("releases its scene listener, including repeated disposal", () => {
    const f = fixture();
    f.manager.destroy();
    f.manager.destroy();
    f.deliver(100);
    expect(f.scene.events.listenerCount(GATHERED_RESOURCE_CREDITED)).toBe(0);
    f.manager.update(5000);
    expect(f.blackboard.economy.incomeSmoothed.wood).toBe(0);
  });
});
