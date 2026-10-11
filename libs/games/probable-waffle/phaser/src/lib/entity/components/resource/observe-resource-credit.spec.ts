import type Phaser from "phaser";
import { Subject } from "rxjs";
import {
  ProbableWafflePlayer,
  ProbableWafflePlayerController,
  ProbableWafflePlayerState,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { getCommunicator, getPlayer, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { ResourceServiceObservation } from "./resource-service-observation";
import type { ResourceServiceEvent } from "./resource-service-event";
import { observeResourceCredit } from "./observe-resource-credit";

jest.mock("../../../data/scene-data", () => ({
  getCommunicator: jest.fn(),
  getPlayer: jest.fn(),
  isSnapshotApplyInProgress: jest.fn()
}));

function fixture(observe = true) {
  jest.clearAllMocks();
  const scene = {} as Phaser.Scene,
    actor = { scene } as Phaser.GameObjects.GameObject;
  const target = { scene } as Phaser.GameObjects.GameObject;
  const money = { food: 10, wood: 10, stone: 10, minerals: 10 };
  const amounts = { wood: 3 };
  const changes = new Subject<{
    property: "resource.added" | "resource.removed";
    data: { playerNumber: number; playerStateData: { resources: Partial<Record<ResourceType, number>> } };
  }>();
  const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
  player.playerState.data.resources = money;
  jest.mocked(getPlayer).mockReturnValue(player);
  jest.mocked(getCommunicator).mockReturnValue({ playerChanged: { on: changes } } as never);
  jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
  const records: ResourceServiceEvent[] = [];
  const release = observe
    ? ResourceServiceObservation.subscribe(actor, (event) => records.push(event))
    : () => undefined;
  const scope = {
    actor,
    target,
    context: undefined,
    channel: "drop_off",
    resourceType: ResourceType.Wood,
    amount: 3,
    ownerArgument: 2
  } satisfies Parameters<typeof observeResourceCredit>[0];
  const callback = (resources = amounts, owner = 2) =>
    changes.next({ property: "resource.added", data: { playerNumber: owner, playerStateData: { resources } } });
  const emit = jest.fn(() => {
    player.addResources(amounts);
    callback();
  });
  return { scene, actor, target, scope, money, amounts, records, changes, release, callback, emit };
}

describe("scoped native gathering credit (unrun until final gate)", () => {
  it("does no authority reads without a marked actor and forwards the native call once", () => {
    const f = fixture(false);
    observeResourceCredit(f.scope, f.scene, f.amounts, f.emit);
    expect(f.emit).toHaveBeenCalledTimes(1);
    expect(getPlayer).not.toHaveBeenCalled();
    expect(getCommunicator).not.toHaveBeenCalled();
    expect(isSnapshotApplyInProgress).not.toHaveBeenCalled();
  });
  it("credits the actual beneficiary only after the exact callback and scoped balance match", () => {
    const f = fixture();
    observeResourceCredit(f.scope, f.scene, f.amounts, f.emit);
    expect(f.records).toMatchObject([
      {
        kind: "resource_credit",
        beneficiary: 2,
        ownerArgument: 2,
        before: { wood: 10 },
        after: { wood: 13 },
        callbackCount: 1,
        balanceMatches: true,
        status: "returned"
      }
    ]);
    expect(f.changes.observed).toBe(false);
    f.release();
  });
  it("keeps campaign suppression, restore suppression and missing channels distinct from income", () => {
    const f = fixture();
    observeResourceCredit(f.scope, f.scene, f.amounts);
    expect(f.records.at(-1)).toMatchObject({ status: "campaign_suppressed", callbackCount: 0, balanceMatches: false });
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(true);
    observeResourceCredit(f.scope, f.scene, f.amounts, () => undefined);
    expect(f.records.at(-1)).toMatchObject({
      status: "returned",
      snapshotRestoreInProgress: true,
      balanceMatches: false
    });
    jest.mocked(getCommunicator).mockReturnValue({} as never);
    observeResourceCredit(f.scope, f.scene, f.amounts, () => {
      f.money.wood += 3;
    });
    expect(f.records.at(-1)).toMatchObject({ callbackCount: 0, balanceMatches: false });
    f.release();
  });
  it("rejects equal copies, other beneficiaries, duplicate callbacks and unrelated balance interference", () => {
    const f = fixture();
    for (const callback of [
      () => f.callback({ ...f.amounts }),
      () => f.callback(f.amounts, 1),
      () => {
        f.callback();
        f.callback();
      },
      () => {
        f.callback();
        f.callback({ wood: 0 });
      }
    ]) {
      observeResourceCredit(f.scope, f.scene, f.amounts, () => {
        f.money.wood += 3;
        callback();
      });
      expect(f.records.at(-1)).toMatchObject({ balanceMatches: false });
    }
    observeResourceCredit(f.scope, f.scene, f.amounts, () => {
      for (let index = 0; index < 20; index++) f.callback();
    });
    expect(f.records.at(-1)).toMatchObject({ callbackCount: 9, balanceMatches: false });
    f.release();
  });
  it("bounds nested attribution and preserves native exceptions even when listeners fail", () => {
    const f = fixture();
    observeResourceCredit(f.scope, f.scene, f.amounts, () => {
      observeResourceCredit(f.scope, f.scene, f.amounts, f.emit);
      f.emit();
    });
    expect(f.records).toMatchObject([{ balanceMatches: true }, { interference: true, balanceMatches: false }]);
    const releaseBroken = ResourceServiceObservation.subscribe(f.actor, () => {
      throw new Error("diagnostic");
    });
    const error = new Error("native");
    expect(() =>
      observeResourceCredit(f.scope, f.scene, f.amounts, () => {
        throw error;
      })
    ).toThrow(error);
    expect(f.changes.observed).toBe(false);
    expect(f.records.at(-1)).toMatchObject({ status: "threw" });
    releaseBroken();
    f.release();
  });
  it("does not carry credit through an asynchronous callback outside the native emission interval", async () => {
    const f = fixture();
    observeResourceCredit(f.scope, f.scene, f.amounts, () => {
      void Promise.resolve().then(f.emit);
    });
    await Promise.resolve();
    expect(f.money.wood).toBe(13);
    expect(f.records.at(-1)).toMatchObject({ callbackCount: 0, balanceMatches: false });
    f.release();
  });
});
