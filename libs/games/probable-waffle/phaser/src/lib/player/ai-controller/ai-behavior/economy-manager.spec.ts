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
  it("resets legacy estimates and pending samples before counting resumed deliveries", () => {
    const f = fixture();
    f.deliver(100);
    f.blackboard.economy.incomeSmoothed.wood = 1000;
    jest.mocked(getSimulationNow).mockReturnValue(20000);
    f.manager.setState(undefined);
    f.manager.update(25000);
    expect(f.blackboard.economy.incomeSmoothed.wood).toBe(0);
    f.deliver(10);
    f.manager.update(30000);
    expect(f.blackboard.economy.incomeInstant.wood).toBe(2);
  });
  it("resumes confirmed pending receipts and sample age exactly without treating restored cash as deliveries", () => {
    const original = fixture();
    original.deliver(20);
    original.manager.update(5000);
    original.deliver(10);
    const saved = original.manager.getState();
    const instant = { ...original.blackboard.economy.incomeInstant };
    const smoothed = { ...original.blackboard.economy.incomeSmoothed };
    jest.mocked(getSimulationNow).mockReturnValue(6500);
    const restored = fixture();
    restored.blackboard.economy.incomeInstant = instant;
    restored.blackboard.economy.incomeSmoothed = smoothed;
    restored.manager.setState(saved);
    restored.blackboard.economy.resources.wood = 9999;
    expect(restored.manager.getState()).toEqual(saved);
    for (const now of [10000, 10000, 15000]) {
      original.manager.update(now);
      restored.manager.update(now);
      expect(restored.blackboard.economy.incomeInstant).toEqual(original.blackboard.economy.incomeInstant);
      expect(restored.blackboard.economy.incomeSmoothed).toEqual(original.blackboard.economy.incomeSmoothed);
    }
    expect(saved.pending.wood).toBe(10);
    expect(restored.manager.getState().pending.wood).toBe(0);
  });
  it("validates saved receipt sampling against the saved tick while the new scene clock is still at zero", () => {
    const f = fixture(),
      saved = { ...f.manager.getState(), sampledAt: 5000, pending: { food: 0, wood: 12, stone: 0, minerals: 0 } };
    f.manager.setState(saved, 5950);
    expect(f.manager.getState()).toEqual(saved);
    f.manager.setState({ ...saved, sampledAt: 6000 }, 5950);
    expect(f.manager.getState()).toMatchObject({ sampledAt: 0, pending: { wood: 0 } });
  });
  it("rejects future sampling clocks and invalid receipt amounts instead of minting income", () => {
    const f = fixture();
    const valid = f.manager.getState();
    for (const saved of [
      { ...valid, sampledAt: 50000 },
      { ...valid, pending: { ...valid.pending, wood: -1 } },
      { ...valid, pending: { ...valid.pending, wood: Number.NaN } }
    ]) {
      f.deliver(100);
      f.blackboard.economy.incomeSmoothed.wood = 900;
      f.manager.setState(saved);
      expect(f.manager.getState().pending.wood).toBe(0);
      expect(f.blackboard.economy.incomeSmoothed.wood).toBe(0);
    }
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
