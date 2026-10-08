import { constructionHistoryFixture } from "./construction-resource-history-fixture";
import Phaser from "phaser";
import { ConstructionStateEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import { HealthComponent } from "../combat/components/health-component";
import { BuilderComponent } from "./builder-component";
import { getActorComponent } from "../../../data/actor-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { onObjectReady } from "../../../data/game-object-helper";
import { subscribeSceneResourceLoss } from "../../../data/scene-resource-observation";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { AiRuntimeRecipientResourceCapture } from "../../../player/ai-controller/testing/ai-runtime-recipient-resource-capture";
import { AiRuntimeResourceCoverageCapture } from "../../../player/ai-controller/testing/ai-runtime-resource-coverage-capture";

const constructionReason = "resource_actor_construction_change", healthReason = "resource_actor_health_change";
const delta = SimulationTickService.TICK_INTERVAL_MS;

describe("construction silent health/work resource history (authored; final gate pending)", () => {
  beforeEach(() => { jest.clearAllMocks(); jest.mocked(onObjectReady).mockReset(); });

  it.each([true, false])("fences initial health before silent writes with health present=%s", (present) => {
    const f = constructionHistoryFixture({}, present), changes = jest.fn(), death = jest.fn(), states: unknown[] = [];
    f.health.healthChanged.subscribe(changes); f.health.armorChanged.subscribe(changes);
    f.actor.on(HealthComponent.KilledEvent, death);
    const remove = subscribeSceneResourceLoss(f.scene, () => states.push(f.health.getData()));
    f.ready();
    expect(states).toEqual(present ? [{ health: 100, armour: 20 }] : []);
    expect(f.health.getData()).toEqual(present ? { health: 10, armour: 2 } : { health: 100, armour: 20 });
    expect(f.coverage.read().losses).toEqual(present ? [healthReason] : []);
    expect(changes).not.toHaveBeenCalled(); expect(death).not.toHaveBeenCalled(); remove(); f.journal.dispose();
  });

  it.each([undefined, 0])("still fences matching initialization and preserves max armor %s", (maxArmour) => {
    const f = constructionHistoryFixture({ initialHealthPercentage: 1 });
    f.health.healthDefinition.maxArmour = maxArmour; f.health.healthComponentData.armour = 7;
    f.ready(); expect(f.health.getData()).toEqual({ health: 100, armour: 7 });
    expect(f.coverage.read().lossEpoch).toBe(1); f.journal.dispose();
  });

  it("fences matching initial health and armor without emitting vitality events", () => {
    const f = constructionHistoryFixture({ initialHealthPercentage: 1 }), events = jest.fn();
    f.health.healthChanged.subscribe(events); f.health.armorChanged.subscribe(events); f.ready();
    expect(f.health.getData()).toEqual({ health: 100, armour: 20 });
    expect(f.coverage.read().lossEpoch).toBe(1); expect(events).not.toHaveBeenCalled(); f.journal.dispose();
  });

  it.each(["automatic", "assigned", "pending", "zero", "capped", "instant", "no-health"] as const)(
    "fences %s work before remaining time/vitality and before native sound/progress callbacks", (route) => {
      const f = constructionHistoryFixture({ progressMadeAutomatically: route === "automatic" || route === "instant" ||
        route === "no-health" || route === "capped" ? 1 : 0 }, route !== "no-health");
      f.ready();
      if (route === "assigned") f.component.assignBuilder(f.object);
      f.component.setData({ state: ConstructionStateEnum.Constructing, remainingConstructionTime: 1000,
        ...(route === "pending" ? { assignedBuilders: ["unresolved", "another"] } : {}) });
      if (route === "capped") { f.health.healthComponentData.health = 100; f.health.healthComponentData.armour = 20; }
      if (route === "instant") f.production.productionTime = 0;
      const initial = f.health.getData(), before = f.component.getData(), states: unknown[] = [];
      const epoch = f.coverage.read().lossEpoch, events = jest.fn();
      f.health.healthChanged.subscribe(events); f.health.armorChanged.subscribe(events);
      const remove = subscribeSceneResourceLoss(f.scene, (reason) => {
        expect(reason).toBe(constructionReason); states.push({ health: f.health.getData(), data: f.component.getData() });
      });
      f.audio.playSpatialAudioSprite.mockImplementation(() => {
        expect(f.coverage.read().lossEpoch).toBeGreaterThan(epoch); expect(f.coverage.read().lost).toBe(true);
      });
      const progress: number[] = [], progressEpochs: number[] = [];
      f.component.constructionProgressPercentageChanged.subscribe((value) => {
        progress.push(value); progressEpochs.push(f.coverage.read().lossEpoch);
      });
      f.component.update();
      expect(states[0]).toEqual({ health: initial, data: before });
      const work = route === "pending" ? delta * 2 : route === "zero" ? 0 : delta;
      expect(f.component.getData().remainingConstructionTime).toBe(1000 - work);
      if (route === "instant" || route === "capped") expect(f.health.getData()).toEqual({ health: 100, armour: 20 });
      else if (route !== "no-health") expect(f.health.getData().health).toBeCloseTo(initial.health + 90 * work / 1000);
      expect(f.coverage.read().lossEpoch).toBe(epoch + 1); expect(progress).toHaveLength(2);
      expect(progressEpochs).toEqual([epoch, epoch + 1]);
      expect(events).not.toHaveBeenCalled(); remove(); f.journal.dispose();
    }
  );

  it("retains instant zero-work completion and its native NaN progress, without arithmetic repair", () => {
    const f = constructionHistoryFixture({ progressMadeAutomatically: 0 }); f.ready();
    f.production.productionTime = 0;
    f.component.setData({ state: ConstructionStateEnum.Constructing, remainingConstructionTime: 0 });
    const epoch = f.coverage.read().lossEpoch;
    f.component.update(); expect(f.component.isFinished).toBe(true);
    expect(f.health.getData()).toEqual({ health: 100, armour: 20 });
    expect(f.component.progressPercentage).toBeNaN(); expect(f.coverage.read().lossEpoch).toBe(epoch + 2);
    f.journal.dispose();
  });

  it("reads current data and definition through the retained facade after the boundary callback", () => {
    const f = constructionHistoryFixture(), data = { health: 70, armour: 8 };
    const remove = subscribeSceneResourceLoss(f.scene, () => {
      f.health.healthComponentData = data; f.health.healthDefinition.maxHealth = 200;
    });
    f.ready(); expect(f.health.healthComponentData).toBe(data); expect(data.health).toBe(20);
    remove(); f.journal.dispose();
  });

  it("keeps production lookup and cached killed guards before the work fence", () => {
    const f = constructionHistoryFixture(); f.ready();
    f.component.setData({ state: ConstructionStateEnum.Constructing, remainingConstructionTime: 1000 });
    const epoch = f.coverage.read().lossEpoch;
    jest.mocked(getPwActorDefinition).mockReturnValue(undefined);
    expect(() => f.component.update()).toThrow("Production definition not found");
    expect(f.coverage.read().lossEpoch).toBe(epoch); expect(f.component.getData().remainingConstructionTime).toBe(1000);
    f.health.healthComponentData.health = 0; f.component.update();
    expect(f.coverage.read().lossEpoch).toBe(epoch); f.journal.dispose();
  });

  it.each(["missing", "full", "none", "pending", "zero-factor", "clamp"] as const)(
    "preserves %s repair guards, pending counts and silent health-only writes", (route) => {
      const f = constructionHistoryFixture({ repairFactor: route === "zero-factor" ? 0 : 1 });
      f.component.setData({ state: ConstructionStateEnum.Finished,
        ...(route === "pending" ? { assignedRepairers: ["one", "two"] } : {}) });
      f.health.healthComponentData.health = route === "full" ? 100 : route === "clamp" ? 99 : 10;
      if (route === "missing") f.replaceHealth(undefined);
      const leave = jest.fn(), repairer = {} as Phaser.GameObjects.GameObject;
      if (route !== "pending" && route !== "none") f.component.assignRepairer(repairer);
      const originalLookup = jest.mocked(getActorComponent).getMockImplementation();
      jest.mocked(getActorComponent).mockImplementation((actor, token) => token === BuilderComponent ?
        { leaveRepairSite: leave } as never : originalLookup?.(actor, token));
      const before = f.health.getData(), epoch = f.coverage.read().lossEpoch, old: unknown[] = [], events = jest.fn();
      const death = jest.fn(); f.actor.on(HealthComponent.KilledEvent, death);
      f.health.healthChanged.subscribe(events); f.health.armorChanged.subscribe(events);
      const remove = subscribeSceneResourceLoss(f.scene, () => old.push(f.health.getData()));
      leave.mockImplementation(() => { expect(f.coverage.read().lost).toBe(true); expect(f.health.getData().health).toBe(100); });
      f.component.update();
      const guarded = ["missing", "full", "none"].includes(route);
      expect(old).toEqual(guarded ? [] : [before]);
      expect(f.coverage.read().lossEpoch).toBe(epoch + (guarded ? 0 : 1));
      expect(f.health.getData().health).toBe(guarded || route === "zero-factor" ? before.health :
        Math.min(100, before.health + delta * (route === "pending" ? 2 : 1)));
      expect(f.health.getData().armour).toBe(before.armour);
      expect(leave).toHaveBeenCalledTimes(route === "clamp" ? 1 : 0);
      expect(events).not.toHaveBeenCalled(); expect(death).not.toHaveBeenCalled();
      expect(f.health.latestDamage).toBeUndefined(); remove(); f.journal.dispose();
    }
  );

  it("preserves local initial, cached progress and fresh repair facade references across observation callbacks", () => {
    const f = constructionHistoryFixture();
    const replacement = new HealthComponent(f.object, { maxHealth: 200 });
    const remove = subscribeSceneResourceLoss(f.scene, () => f.replaceHealth(replacement));
    f.ready(); expect(f.health.getData().health).toBe(10); expect(replacement.getData().health).toBe(200);
    remove(); f.replaceHealth(f.health);
    f.component.setData({ state: ConstructionStateEnum.Constructing, remainingConstructionTime: 1000 });
    replacement.healthComponentData.health = 20; f.component.update();
    expect(replacement.getData().health).toBeCloseTo(20 + 180 * delta / 1000);
    expect(f.health.getData().health).toBe(10);
    f.component.setData({ state: ConstructionStateEnum.Finished }); f.component.assignRepairer(f.object);
    f.component.update(); expect(f.health.getData().health).toBe(Math.min(100, 10 + delta));
    f.journal.dispose();
  });

  it("isolates an observer error, journals later native credit with loss and detaches across fresh captures", () => {
    const f = constructionHistoryFixture(), remove = subscribeSceneResourceLoss(f.scene, () => { throw new Error("observer"); });
    const later: string[] = [], removeLater = subscribeSceneResourceLoss(f.scene, (reason) => later.push(reason));
    f.component.completeConstruction(); expect(later).toEqual([constructionReason]);
    f.player.addResources({ wood: 3 });
    expect(f.facts.at(-1)).toMatchObject({ mutation: { phase: "returned", lossEpoch: 1 } });
    expect(f.coverage.read().cohorts).toEqual([]); remove(); removeLater(); f.journal.dispose();
    const before = f.coverage.read(), count = f.facts.length;
    f.component.setData({}); f.player.addResources({ wood: 1 });
    expect(f.coverage.read()).toEqual(before); expect(f.facts).toHaveLength(count);
    const fresh = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: 0 }));
    const facts: unknown[] = [];
    const journal = new AiRuntimeRecipientResourceCapture(f.scene, fresh,
      (playerNumber) => ({ playerNumber, tick: 0, sequence: 0 }), () => 0, (fact) => facts.push(fact));
    expect(fresh.read()).toMatchObject({ lost: false, cohorts: [], channels: { cargoLifetime: "partial" } });
    expect(facts).toHaveLength(1); f.component.setData({});
    expect(fresh.read().losses).toEqual([constructionReason]); expect(f.coverage.read()).toEqual(before); journal.dispose();
  });
});
