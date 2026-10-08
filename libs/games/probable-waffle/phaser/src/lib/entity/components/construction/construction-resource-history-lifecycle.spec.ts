import { constructionHistoryFixture } from "./construction-resource-history-fixture";
import Phaser from "phaser";
import { ConstructionStateEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import { onObjectReady } from "../../../data/game-object-helper";
import { getActorComponent } from "../../../data/actor-component";
import { upgradeFromConstructingToFullActorData } from "../../../data/actor-data";
import { subscribeSceneResourceLoss } from "../../../data/scene-resource-observation";
import { startConstructionPayment, refundConstructionPayment } from "./construction-payment";
import { BuilderComponent } from "./builder-component";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import { HealthComponent } from "../combat/components/health-component";
import { ProbableWaffleSceneEventName } from "../../../world/services/recovery/probable-waffle-scene-events";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";

const reason = "resource_actor_construction_change";

describe("construction lifecycle resource history (authored; final gate pending)", () => {
  beforeEach(() => {
    jest.clearAllMocks(); jest.mocked(onObjectReady).mockReset();
    jest.mocked(startConstructionPayment).mockReset(); jest.mocked(refundConstructionPayment).mockReset();
    jest.mocked(upgradeFromConstructingToFullActorData).mockReset();
  });

  it("keeps payment before pre-write loss, followed by state callbacks with loss", () => {
    const f = constructionHistoryFixture({}, false), order: string[] = [];
    jest.mocked(startConstructionPayment).mockImplementation(() => {
      expect(f.component.getData().state).toBe(ConstructionStateEnum.NotStarted);
      expect(f.coverage.read().lost).toBe(false); order.push("payment");
    });
    const remove = subscribeSceneResourceLoss(f.scene, () => {
      expect(f.component.getData()).toMatchObject({ state: ConstructionStateEnum.NotStarted, remainingConstructionTime: 0 });
      order.push("loss");
    });
    f.component.constructionStateChanged.subscribe(() => {
      expect(f.coverage.read().losses).toContain(reason); order.push("state");
    });
    f.component.startConstruction(); expect(order).toEqual(["payment", "loss", "state"]);
    expect(f.component.getData()).toMatchObject({ state: ConstructionStateEnum.Constructing, remainingConstructionTime: 1000 });
    const epoch = f.coverage.read().lossEpoch;
    expect(() => f.component.startConstruction()).toThrow("can only be started once");
    expect(f.coverage.read().lossEpoch).toBe(epoch); remove(); f.journal.dispose();
  });

  it.each(["Cannot afford building costs", "native payment throw"])("preserves %s without a construction fence", (message) => {
    const f = constructionHistoryFixture({}, false), error = new Error(message);
    jest.mocked(startConstructionPayment).mockImplementation(() => { throw error; });
    expect(() => f.component.startConstruction()).toThrow(error);
    expect(f.coverage.read().lost).toBe(false);
    expect(f.component.getData()).toMatchObject({ state: ConstructionStateEnum.NotStarted, remainingConstructionTime: 0 });
    f.journal.dispose();
  });

  it.each(["immediate", "assigned"] as const)("preserves %s start and silent initialization distinction", (route) => {
    const f = constructionHistoryFixture({ startImmediately: route === "immediate", progressMadeAutomatically: 0 });
    f.ready(); f.health.healthComponentData.health = 30;
    if (route === "assigned") f.component.assignBuilder(f.object);
    const epoch = f.coverage.read().lossEpoch;
    f.component.update();
    expect(startConstructionPayment).toHaveBeenCalledTimes(1);
    expect(f.coverage.read().lossEpoch).toBe(epoch + (route === "immediate" ? 3 : 2));
    expect(f.health.getData().health).toBeCloseTo(route === "immediate" ? 10 :
      30 + 90 * SimulationTickService.TICK_INTERVAL_MS / 1000);
    f.journal.dispose();
  });

  it("keeps immediate initial health after a synchronous start callback completes construction", () => {
    const f = constructionHistoryFixture({ startImmediately: true }); f.ready();
    f.component.constructionStateChanged.subscribe((state) => {
      if (state === ConstructionStateEnum.Constructing) f.component.completeConstruction();
    });
    f.component.update(); expect(f.component.isFinished).toBe(true);
    expect(f.health.getData()).toEqual({ health: 10, armour: 2 });
    expect(f.coverage.read().lossEpoch).toBe(4); f.journal.dispose();
  });

  it.each(["manual", "progress", "no-health"] as const)("fences %s finish before all native completion callbacks", (route) => {
    const f = constructionHistoryFixture({ consumesBuilders: true }, route !== "no-health"); f.ready();
    if (route === "progress") f.component.setData({ state: ConstructionStateEnum.Constructing, remainingConstructionTime: 0 });
    const order: string[] = [], oldFinished: boolean[] = [];
    const builder = { destroy: () => order.push("builder") } as unknown as Phaser.GameObjects.GameObject;
    f.component.assignBuilder(builder);
    const remove = subscribeSceneResourceLoss(f.scene, () => {
      oldFinished.push(f.component.isFinished); expect(f.coverage.read().lost).toBe(true); order.push("loss");
    });
    f.component.constructionStateChanged.subscribe(() => {
      expect(f.component.isFinished).toBe(true); expect(f.coverage.read().losses).toContain(reason); order.push("state");
    });
    f.audio.playSpatialAudioSprite.mockImplementation(() => order.push("sound"));
    jest.mocked(upgradeFromConstructingToFullActorData).mockImplementation(() => { order.push("upgrade"); });
    f.scene.events.on(ProbableWaffleSceneEventName.ScoreBuildingConstructed, () => order.push("score"));
    if (route === "progress") f.component.update(); else f.component.completeConstruction();
    expect(order).toEqual(route === "progress" ? ["loss", "sound", "loss", "state", "sound", "builder", "upgrade", "score"] :
      ["loss", "state", "sound", "builder", "upgrade", "score"]);
    expect(oldFinished).toEqual(route === "progress" ? [false, false] : [false]);
    const epoch = f.coverage.read().lossEpoch; f.component.completeConstruction(); f.component.cancelConstruction();
    expect(f.coverage.read().lossEpoch).toBe(epoch); expect(refundConstructionPayment).not.toHaveBeenCalled();
    remove(); f.journal.dispose();
  });

  it("fences empty/matching/partial restore before resolution and native notifications without changing saved fields", () => {
    const f = constructionHistoryFixture(), old: unknown[] = [], notifications: string[] = [];
    const remove = subscribeSceneResourceLoss(f.scene, () => old.push(f.component.getData()));
    f.component.constructionProgressPercentageChanged.subscribe(() => notifications.push("progress")); notifications.length = 0;
    f.component.constructionStateChanged.subscribe(() => {
      expect(f.coverage.read().losses).toContain(reason); notifications.push("state");
    });
    f.index.getActorById.mockImplementation(() => { expect(f.coverage.read().lost).toBe(true); return null; });
    const initial = f.component.getData(); f.component.setData({}); f.component.setData(initial);
    f.component.setData({ state: ConstructionStateEnum.Constructing, remainingConstructionTime: 500,
      progressPercentage: 50, playingBuildSound: true, assignedBuilders: ["builder"] });
    expect(old.slice(0, 2)).toEqual([initial, initial]); expect(f.coverage.read().lossEpoch).toBe(3);
    expect(f.component.getData()).toEqual({ ...initial, state: ConstructionStateEnum.Constructing,
      remainingConstructionTime: 500, progressPercentage: 50, playingBuildSound: true });
    expect(notifications).toEqual(["progress", "state", "progress", "state", "progress", "state"]);
    f.index.getActorById.mockReturnValue(f.object as never); f.component.update();
    expect(f.component.getData().assignedBuilders).toEqual(["actor"]); remove(); f.journal.dispose();
  });

  it("keeps cancellation refund, order reset, repeated teardown and unsubscribe without a new state fence", () => {
    const f = constructionHistoryFixture(), order: string[] = [], reset = jest.fn(() => order.push("reset"));
    const original = jest.mocked(getActorComponent).getMockImplementation();
    jest.mocked(getActorComponent).mockImplementation((actor, token) => token === PawnAiController ?
      { blackboard: { resetCurrentOrder: reset } } as never : original?.(actor, token));
    f.component.assignBuilder(f.object);
    jest.mocked(refundConstructionPayment).mockImplementation(() => { order.push("refund"); });
    f.actor.emit(HealthComponent.KilledEvent); f.actor.emit(Phaser.GameObjects.Events.DESTROY);
    expect(order).toEqual(["refund", "reset", "refund", "reset"]); expect(f.ticks.observed).toBe(false);
    expect(f.component.getData().state).toBe(ConstructionStateEnum.NotStarted);
    expect(f.coverage.read().lost).toBe(false); f.journal.dispose();
  });

  it("retains native refund failure before tick cleanup", () => {
    const f = constructionHistoryFixture(), error = new Error("refund");
    jest.mocked(refundConstructionPayment).mockImplementation(() => { throw error; });
    expect(() => f.actor.emit(HealthComponent.KilledEvent)).toThrow(error);
    expect(f.ticks.observed).toBe(true); expect(f.coverage.read().lost).toBe(false);
    f.ticks.complete(); f.journal.dispose();
  });

  it.each(["sound", "upgrade", "repair"] as const)("retains %s callback failure and partial native state", (route) => {
    const f = constructionHistoryFixture(), error = new Error(route); f.ready();
    if (route === "sound") {
      f.component.startConstruction(); f.audio.playSpatialAudioSprite.mockImplementation(() => { throw error; });
      expect(() => f.component.update()).toThrow(error);
      expect(f.component.getData()).toMatchObject({ state: ConstructionStateEnum.Constructing,
        remainingConstructionTime: 1000 - SimulationTickService.TICK_INTERVAL_MS, progressPercentage: 0, playingBuildSound: true });
    } else if (route === "upgrade") {
      jest.mocked(upgradeFromConstructingToFullActorData).mockImplementation(() => { throw error; });
      const score = jest.fn(); f.scene.events.on(ProbableWaffleSceneEventName.ScoreBuildingConstructed, score);
      expect(() => f.component.completeConstruction()).toThrow(error); expect(f.component.isFinished).toBe(true);
      expect(score).not.toHaveBeenCalled();
    } else {
      f.component.setData({ state: ConstructionStateEnum.Finished }); f.component.assignRepairer(f.object);
      f.health.healthComponentData.health = 99;
      const original = jest.mocked(getActorComponent).getMockImplementation();
      jest.mocked(getActorComponent).mockImplementation((actor, token) => token === BuilderComponent ?
        { leaveRepairSite: () => { throw error; } } as never : original?.(actor, token));
      expect(() => f.component.update()).toThrow(error); expect(f.health.getData()).toEqual({ health: 100, armour: 2 });
    }
    expect(f.coverage.read().lost).toBe(true); f.journal.dispose();
  });

  it("nested restore/finish/progress reads retain sticky loss and original synchronous state ordering", () => {
    const f = constructionHistoryFixture();
    let nested = false;
    f.component.constructionStateChanged.subscribe((state) => {
      expect(f.coverage.read().lost).toBe(true); f.journal.reconcile();
      if (state === ConstructionStateEnum.Constructing && !nested) {
        nested = true; f.component.setData({ progressPercentage: 25 }); f.component.completeConstruction();
      }
    });
    f.component.startConstruction();
    expect(f.component.getData()).toMatchObject({ state: ConstructionStateEnum.Finished, progressPercentage: 25,
      remainingConstructionTime: 1000 });
    expect(f.coverage.read().lossEpoch).toBe(3); f.journal.dispose();
  });
});
