import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import Phaser from "phaser";
import { type ProbableWafflePlayer, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { emitResource, getPlayer, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { creditGatheredResource, GATHERED_RESOURCE_CREDITED } from "./credit-gathered-resource";

jest.mock("../../../data/scene-data", () => ({
  emitResource: jest.fn(),
  getPlayer: jest.fn(),
  isSnapshotApplyInProgress: jest.fn(() => false)
}));

function fixture(applied = 10) {
  let wood = 100;
  const scene = { events: new Phaser.Events.EventEmitter() } as Phaser.Scene;
  const listener = jest.fn();
  scene.events.on(GATHERED_RESOURCE_CREDITED, listener);
  jest.mocked(getPlayer).mockReturnValue({ getResources: () => ({ wood }) } as ProbableWafflePlayer);
  jest.mocked(emitResource).mockImplementation(() => {
    wood += applied;
  });
  const amounts = { wood: 10 };
  return { scene, listener, amounts, credit: () => creditGatheredResource(scene, 2, ResourceType.Wood, amounts) };
}

describe("gathered resource receipts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
  });
  it("preserves the exact native payload and publishes only after actual credit", () => {
    const f = fixture();
    f.credit();
    expect(emitResource).toHaveBeenCalledTimes(1);
    expect(requireAiTestEntry(jest.mocked(emitResource).mock.calls, 0)[2]).toBe(f.amounts);
    expect(f.listener).toHaveBeenCalledWith(2, ResourceType.Wood, 10);
  });
  it.each([0, 5, 20])("does not invent income for a missing/partial/overwritten credit (%s)", (amount) => {
    const f = fixture(amount);
    f.credit();
    expect(f.listener).not.toHaveBeenCalled();
  });
  it("does not count restore or a failed native mutation", () => {
    const f = fixture();
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(true);
    f.credit();
    expect(f.listener).not.toHaveBeenCalled();
    jest.mocked(emitResource).mockImplementation(() => {
      throw new Error("failed");
    });
    expect(f.credit).toThrow("failed");
    expect(f.listener).not.toHaveBeenCalled();
  });
});
