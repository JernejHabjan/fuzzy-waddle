import Phaser from "phaser";
import { DamageType, ProbableWafflePlayer, ProbableWafflePlayerState, ProbableWafflePlayerController } from
  "@fuzzy-waddle/probable-waffle-protocol";
import { HealthComponent } from "./health-component";
import { onObjectReady, isGameObjectActiveInActiveScene } from "../../../../data/game-object-helper";
import { applyCampaignProgressionModifiers } from "../../../../campaign/campaign-progression-modifier";
import { subscribeSceneResourceLoss } from "../../../../data/scene-resource-observation";
import { AiRuntimeRecipientResourceCapture } from "../../../../player/ai-controller/testing/ai-runtime-recipient-resource-capture";
import { AiRuntimeResourceCoverageCapture } from "../../../../player/ai-controller/testing/ai-runtime-resource-coverage-capture";
import type { AiRuntimeProductionFactV1 } from "../../../../player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";

jest.mock("./health-presentation", () => ({ HealthPresentation: class {
  attach() {} init() {} initializeArmorFromData() {} reactToDamageVisually() {} reactToHeal() {} showOnDamage() {}
  syncArmorUiComponent() {} refreshUiComponents() {} disposeTimers() {} detach() {} setVisibilityUiComponent() {}
} }));
jest.mock("../../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../../data/game-object-helper", () => ({ onObjectReady: jest.fn(),
  isGameObjectActiveInActiveScene: jest.fn(), getGameObjectVisibility: () => ({ visible: false }) }));
jest.mock("../../../../data/scene-data", () => ({ getCurrentPlayerNumber: jest.fn(), getPlayer: jest.fn() }));
jest.mock("../../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../../campaign/campaign-progression-modifier", () => ({ applyCampaignProgressionModifiers: jest.fn() }));
jest.mock("../../../../world/services/simulation-time", () => ({ getSimulationNow: () => 0,
  CancelableSimDelay: class { remove() {} } }));
jest.mock("../../../../world/services/simulation-tick.service", () => ({ SimulationTickService: class {} }));
jest.mock("../../../../world/services/audio.service", () => ({ AudioService: class {} }));
jest.mock("../../owner-component", () => ({ OwnerComponent: class {} }));
jest.mock("../../selectable-component", () => ({ SelectableComponent: class {} }));
jest.mock("../../actor-audio/audio-actor-component", () => ({ AudioActorComponent: class {} }));
jest.mock("../../animation/animation-actor-component", () => ({ AnimationActorComponent: class {} }));
jest.mock("../../construction/construction-site-component", () => ({ ConstructionSiteComponent: class {} }));
jest.mock("../../building/fade-out-component", () => ({ FadeOutComponent: class {} }));
jest.mock("../../building/building-destruction-effect", () => ({
  BuildingDestructionEffect: { spawnDestructionEffects: jest.fn() }
}));

function fixture() {
  const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
  Object.defineProperty(player, "playerNumber", { value: 1 });
  const scene = { players: [player], events: new Phaser.Events.EventEmitter() } as ProbableWaffleScene;
  const actor = Object.assign(new Phaser.Events.EventEmitter(), { scene, active: true, getData: jest.fn(),
    destroy: jest.fn() });
  actor.destroy.mockImplementation(() => { actor.active = false; actor.emit(Phaser.GameObjects.Events.DESTROY); });
  const health = new HealthComponent(actor as unknown as Phaser.GameObjects.GameObject, { maxHealth: 100, maxArmour: 10 });
  const facts: AiRuntimeProductionFactV1[] = [];
  const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: facts.length }));
  const journal = new AiRuntimeRecipientResourceCapture(scene, coverage,
    (playerNumber) => ({ playerNumber, tick: 0, sequence: 0 }), () => facts.length,
    (fact) => facts.push({ ...fact, sequence: facts.length + 1 }));
  return { actor, scene, health, coverage, journal, facts, player };
}

function initialize(f: ReturnType<typeof fixture>) {
  const call = jest.mocked(onObjectReady).mock.calls.find(([actor]) => actor === f.actor);
  if (!call) throw new Error("health_ready_missing"); call[1].call(call[2]);
}

const reason = "resource_actor_health_change";
describe("passive health resource history boundary (final gate pending)", () => {
  beforeEach(() => {
    jest.clearAllMocks(); jest.mocked(onObjectReady).mockReset();
    jest.mocked(isGameObjectActiveInActiveScene).mockImplementation(
      (actor): actor is Phaser.GameObjects.GameObject => !!actor?.active
    );
    jest.mocked(applyCampaignProgressionModifiers).mockImplementation((_actor, _kind, value) => value);
  });

  it("fences before changed health/armor assignment and before native event reentrant reads, without a cohort filter", () => {
    const f = fixture(), oldStates: Array<{ health: number; armour: number }> = [], order: string[] = [];
    const remove = subscribeSceneResourceLoss(f.scene, () => {
      expect(f.coverage.read().lost).toBe(true); oldStates.push(f.health.getData()); order.push("loss");
    });
    f.health.healthChanged.subscribe((value) => {
      expect(f.health.getData().health).toBe(value); expect(f.coverage.read().losses).toContain(reason);
      f.journal.reconcile(); order.push("health");
    });
    f.health.armorChanged.subscribe((value) => {
      expect(f.health.getData().armour).toBe(value); expect(f.coverage.read().lost).toBe(true); order.push("armor");
    });
    expect(f.coverage.read().cohorts).toEqual([]);
    f.health.setData({ health: 70, armour: 4 });
    expect(oldStates).toEqual([{ health: 100, armour: 10 }, { health: 70, armour: 10 }]);
    expect(order).toEqual(["loss", "health", "loss", "armor"]);
    expect(f.coverage.read().lossEpoch).toBe(2); remove(); f.journal.dispose();
  });

  it("keeps empty/same restore and full resets no-ops; changed reset, heal and armor-first damage delegate", () => {
    const f = fixture();
    f.health.setData({}); f.health.setData({ health: 100, armour: 10 }); f.health.resetHealth(); f.health.resetArmor();
    f.health.heal(1); f.health.takeDamage(0, DamageType.Physical); expect(f.coverage.read().lost).toBe(false);
    f.health.takeDamage(12, DamageType.Physical); expect(f.health.getData()).toEqual({ health: 100, armour: 0 });
    expect(f.coverage.read().lossEpoch).toBe(1);
    f.health.takeDamage(20, DamageType.Physical); f.health.heal(5); f.health.resetHealth(); f.health.resetArmor();
    expect(f.health.getData()).toEqual({ health: 100, armour: 10 }); expect(f.coverage.read().lossEpoch).toBe(5);
    f.journal.dispose();
  });

  it("fences before initialization modifiers and direct writes, even for matching values; failures retain sticky loss", () => {
    const f = fixture(), healthEvent = jest.fn(), armorEvent = jest.fn();
    f.health.healthChanged.subscribe(healthEvent); f.health.armorChanged.subscribe(armorEvent);
    jest.mocked(applyCampaignProgressionModifiers).mockImplementation((_actor, _kind, value) => {
      expect(f.coverage.read().losses).toContain(reason); return value;
    });
    initialize(f); expect(f.health.getData()).toEqual({ health: 100, armour: 10 });
    expect(f.coverage.read().lossEpoch).toBe(1);
    expect(healthEvent).not.toHaveBeenCalled(); expect(armorEvent).not.toHaveBeenCalled(); f.journal.dispose();
    const failed = fixture(), error = new Error("modifier");
    jest.mocked(applyCampaignProgressionModifiers).mockImplementation(() => { throw error; });
    expect(() => initialize(failed)).toThrow(error);
    expect(failed.health.getData()).toEqual({ health: 100, armour: 10 });
    expect(failed.coverage.read().losses).toContain(reason); failed.journal.dispose();
  });

  it("fences definition replacement before callbacks even when its resulting health/armor match", () => {
    const f = fixture(), original = f.health.healthDefinition, states: unknown[] = [];
    const remove = subscribeSceneResourceLoss(f.scene, () => states.push(f.health.healthDefinition));
    const definition = { maxHealth: 100, maxArmour: 10 };
    f.health.setHealthDefinition(definition);
    expect(states).toEqual([original]); expect(f.health.healthDefinition).toBe(definition);
    expect(f.coverage.read().lossEpoch).toBe(1); remove(); f.journal.dispose();
  });

  it.each(["killActor", "destroyActorSilently"] as const)(
    "%s fences already-zero active actors before death callbacks", (route) => {
      const f = fixture(); f.health.setData({ health: 0 }); f.journal.dispose();
      const events: string[] = [], remove = subscribeSceneResourceLoss(f.scene, () => events.push("loss"));
      f.health.healthChanged.subscribe(() => events.push("health"));
      f.scene.events.on(HealthComponent.KilledEvent, () => events.push("scene"));
      f.actor.on(HealthComponent.KilledEvent, () => events.push("actor"));
      f.health[route](); expect(events).toEqual(["loss", "scene", "actor"]);
      expect(f.actor.destroy).toHaveBeenCalledTimes(route === "destroyActorSilently" ? 1 : 0);
      f.actor.active = false; f.health[route](); expect(events).toEqual(["loss", "scene", "actor"]); remove();
    }
  );

  it("fences normal/silent changed-health kill routes before zero and retains suppressed restore/death ordering", () => {
    for (const route of ["killActor", "destroyActorSilently"] as const) {
      const f = fixture(), order: string[] = [];
      const remove = subscribeSceneResourceLoss(f.scene, () => order.push("loss"));
      f.health.healthChanged.subscribe(() => { expect(f.coverage.read().lost).toBe(true); order.push("health"); });
      f.scene.events.on(HealthComponent.KilledEvent, () => order.push("scene"));
      f.actor.on(HealthComponent.KilledEvent, () => order.push("actor"));
      f.health[route](); expect(order).toEqual(["loss", "loss", "health", "scene", "actor"]);
      expect(f.coverage.read().lossEpoch).toBe(2); remove(); f.journal.dispose();
    }
    const f = fixture(), death = jest.fn(); f.actor.on(HealthComponent.KilledEvent, death);
    f.health.setData({ health: 0, armour: 0 }); expect(death).not.toHaveBeenCalled();
    expect(f.coverage.read().lossEpoch).toBe(2); f.journal.dispose();
  });

  it("preserves throwing and nested native event dispatch with observation already lost", () => {
    const f = fixture(), error = new Error("native event");
    const emit = jest.spyOn(f.health.healthChanged, "emit").mockImplementation(() => {
      expect(f.coverage.read().lost).toBe(true); expect(f.health.getData().health).toBe(70); throw error;
    });
    expect(() => f.health.setData({ health: 70, armour: 4 })).toThrow(error);
    expect(f.health.getData()).toEqual({ health: 70, armour: 10 }); emit.mockRestore();
    const values: number[] = [];
    f.health.healthChanged.subscribe((value) => { values.push(value); if (value === 60) f.health.setData({ health: 50 }); });
    f.health.setData({ health: 60 }); expect(values).toEqual([60, 50]); expect(f.health.getData().health).toBe(50);
    expect(f.coverage.read().lossEpoch).toBe(3); f.journal.dispose();
  });

  it("retains armor event failure after assignment and damage-driven death after the changed-health event", () => {
    const f = fixture(), error = new Error("armor event");
    const emit = jest.spyOn(f.health.armorChanged, "emit").mockImplementation(() => {
      expect(f.coverage.read().lost).toBe(true); expect(f.health.getData().armour).toBe(0); throw error;
    });
    expect(() => f.health.takeDamage(10, DamageType.Physical)).toThrow(error);
    expect(f.health.getData()).toEqual({ health: 100, armour: 0 }); emit.mockRestore();
    const order: string[] = [], remove = subscribeSceneResourceLoss(f.scene, () => order.push("loss"));
    f.health.healthChanged.subscribe(() => order.push("health"));
    f.scene.events.on(HealthComponent.KilledEvent, () => order.push("scene"));
    f.actor.on(HealthComponent.KilledEvent, () => order.push("actor"));
    f.health.takeDamage(100, DamageType.Physical);
    expect(order).toEqual(["loss", "health", "loss", "scene", "actor"]);
    expect(f.health.killed).toBe(true); expect(f.coverage.read().lossEpoch).toBe(3); remove(); f.journal.dispose();
  });

  it("isolates observer errors, captures later native credit with loss, and detaches across disposed/fresh captures", () => {
    const f = fixture(), remove = subscribeSceneResourceLoss(f.scene, () => { throw new Error("observer"); });
    f.health.heal(-1); expect(f.health.getData().health).toBe(99); remove();
    f.player.addResources({ wood: 3 }); expect(f.facts.at(-1)).toMatchObject({ mutation: { phase: "returned", lossEpoch: 1 } });
    f.journal.dispose(); const old = f.coverage.read(), count = f.facts.length;
    f.health.resetHealth(); f.player.addResources({ wood: 1 });
    expect(f.coverage.read()).toEqual(old); expect(f.facts).toHaveLength(count);
    const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: 0 }));
    const journal = new AiRuntimeRecipientResourceCapture(f.scene, coverage,
      (playerNumber) => ({ playerNumber, tick: 0, sequence: 0 }), () => 0, () => undefined);
    expect(coverage.read()).toMatchObject({ lost: false, cohorts: [], channels: { cargoLifetime: "partial" } });
    f.health.setData({ health: 98 }); expect(coverage.read().losses).toContain(reason);
    expect(f.coverage.read()).toEqual(old); journal.dispose();
  });
});
