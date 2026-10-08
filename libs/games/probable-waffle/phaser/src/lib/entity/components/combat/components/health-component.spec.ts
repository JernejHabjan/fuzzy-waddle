import Phaser from "phaser";
import { Subject } from "rxjs";
import { DamageType } from "@fuzzy-waddle/probable-waffle-protocol";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";
import type { HealthDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/health-definition";
import { HealthComponent } from "./health-component";
import { HealthUiComponent } from "./health-ui-component";
import { ConstructionSiteComponent } from "../../construction/construction-site-component";
import { ContainerComponent } from "../../building/container-component";
import { VisionComponent } from "../../vision-component";
import { ActorTranslateComponent } from "../../movement/actor-translate-component";
import { AudioActorComponent } from "../../actor-audio/audio-actor-component";
import { getActorComponent } from "../../../../data/actor-component";
import { onObjectReady, isGameObjectActiveInActiveScene } from "../../../../data/game-object-helper";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { applyCampaignProgressionModifiers } from "../../../../campaign/campaign-progression-modifier";
import { EffectsAnims } from "../../../../animations/effects";
import { CancelableSimDelay } from "../../../../world/services/simulation-time";
import { FadeOutComponent } from "../../building/fade-out-component";

jest.mock("./health-ui-component", () => ({ HealthUiComponent: jest.fn().mockImplementation(() => ({
  setVisibility: jest.fn(), refresh: jest.fn(), destroy: jest.fn(),
  getBounds: () => ({ x: 10, y: 20, width: 30, height: 8 })
})) }));
jest.mock("../../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../../data/game-object-helper", () => ({ onObjectReady: jest.fn(),
  isGameObjectActiveInActiveScene: jest.fn(), getGameObjectVisibility: () => ({ visible: true }),
  getGameObjectBounds: () => ({ top: 11 }), getGameObjectDepth: () => 7 }));
jest.mock("../../../../data/scene-data", () => ({ getCurrentPlayerNumber: jest.fn(), getPlayer: jest.fn() }));
jest.mock("../../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../../campaign/campaign-progression-modifier", () => ({ applyCampaignProgressionModifiers: jest.fn() }));
jest.mock("../../../../animations/effects", () => ({ EffectsAnims: {
  ANIM_IMPACT_16: "heal", createAndPlayBloodAnimation: jest.fn(), createAndPlayEffectAnimation: jest.fn()
} }));
jest.mock("../../../../world/services/simulation-time", () => ({
  getSimulationNow: () => 123, CancelableSimDelay: jest.fn().mockImplementation(() => ({ remove: jest.fn() }))
}));
jest.mock("../../../../world/services/simulation-tick.service", () => ({ SimulationTickService: class {} }));
jest.mock("../../../../world/services/audio.service", () => ({ AudioService: class {} }));
jest.mock("../../owner-component", () => ({ OwnerComponent: class {} }));
jest.mock("../../selectable-component", () => ({ SelectableComponent: class {} }));
jest.mock("../../actor-audio/audio-actor-component", () => ({ AudioActorComponent: class {} }));
jest.mock("../../animation/animation-actor-component", () => ({ AnimationActorComponent: class {} }));
jest.mock("../../movement/actor-translate-component", () => ({ ActorTranslateComponent: class {} }));
jest.mock("../../building/container-component", () => ({ ContainerComponent: class {
  static GameObjectVisibilityChanged = "visibility";
} }));
jest.mock("../../construction/construction-site-component", () => ({ ConstructionSiteComponent: class {} }));
jest.mock("../../vision-component", () => ({ VisionComponent: class {} }));
jest.mock("../../building/fade-out-component", () => ({ FadeOutComponent: jest.fn() }));
jest.mock("../../building/building-destruction-effect", () => ({
  BuildingDestructionEffect: { spawnDestructionEffects: jest.fn() }
}));

function fixture(definition: HealthDefinition = { maxHealth: 100, maxArmour: 10 }) {
  const timers: Array<{ ms: number; callback: () => void; remove: jest.Mock }> = [];
  const scene = { events: new Phaser.Events.EventEmitter(), time: { delayedCall: (ms: number, callback: () => void) => {
    const timer = { ms, callback, remove: jest.fn() }; timers.push(timer); return timer;
  } } };
  const actor = Object.assign(new Phaser.Events.EventEmitter(), { scene, active: true,
    getData: jest.fn(), setTint: jest.fn(), clearTint: jest.fn(), setVisible: jest.fn(), destroy: jest.fn() });
  const health = new HealthComponent(actor as unknown as Phaser.GameObjects.GameObject, definition);
  return { scene, actor, health, definition, timers };
}

function ready(f: ReturnType<typeof fixture>) {
  const call = jest.mocked(onObjectReady).mock.calls.find(([actor]) => actor === f.actor);
  if (!call) throw new Error("health_ready_missing");
  call[1].call(call[2]);
}

function bars() {
  return jest.mocked(HealthUiComponent).mock.results.map((result) => result.value as {
    setVisibility: jest.Mock; refresh: jest.Mock; destroy: jest.Mock;
  });
}

describe("health facade and presentation (authored; final gate pending)", () => {
  beforeEach(() => {
    jest.clearAllMocks(); jest.mocked(onObjectReady).mockReset();
    jest.mocked(isGameObjectActiveInActiveScene).mockImplementation(
      (actor): actor is Phaser.GameObjects.GameObject => !!actor?.active
    );
    jest.mocked(getActorComponent).mockImplementation((_actor, token) =>
      token === VisionComponent ? { visibilityByCurrentPlayer: true } as never : undefined);
    jest.mocked(getSceneService).mockReturnValue(undefined);
    jest.mocked(applyCampaignProgressionModifiers).mockImplementation((_actor, _modifier, value) => value);
    Object.defineProperty(HealthUiComponent, "barBorder", { value: 2, configurable: true });
  });

  it("preserves live data, defined restore events without reactions, no-op restores and definition replacement", () => {
    const f = fixture(), state = f.health.healthComponentData, healthEvent = jest.fn(), armorEvent = jest.fn();
    f.health.healthChanged.subscribe(healthEvent); f.health.armorChanged.subscribe(armorEvent);
    expect(f.health.healthDefinition).toBe(f.definition);
    f.health.setData({ health: 60, armour: 4 }); f.health.setData({}); f.health.setData({ health: 60, armour: 4 });
    expect(f.health.healthComponentData).toBe(state);
    expect(healthEvent.mock.calls).toEqual([[60]]); expect(armorEvent.mock.calls).toEqual([[4]]);
    const saved = f.health.getData(); saved.health = 1; expect(state.health).toBe(60);
    expect(EffectsAnims.createAndPlayEffectAnimation).not.toHaveBeenCalled();
    const definition = { maxHealth: 120, maxArmour: 0 };
    f.health.setHealthDefinition(definition);
    expect(f.health.healthDefinition).toBe(definition); expect(state).toEqual({ health: 120, armour: 0 });
    expect(bars()[1].destroy).toHaveBeenCalled(); expect(bars()[0].refresh).toHaveBeenCalled();
    expect(f.health.healthIsFull).toBe(true); expect(f.health.isDamaged).toBe(false);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("stores presentation before eager ready, modifies initial state directly without health/armor events", () => {
    jest.mocked(onObjectReady).mockImplementation((_actor, callback, scope) => callback.call(scope));
    jest.mocked(applyCampaignProgressionModifiers).mockImplementation((_actor, kind, value) =>
      kind === "maximum-health" ? value + 20 : value + 5);
    const f = fixture({ maxHealth: 100 });
    expect(f.health.getData()).toEqual({ health: 120, armour: 5 });
    expect(bars()).toHaveLength(2); expect(f.scene.events.listenerCount(Phaser.Scenes.Events.UPDATE)).toBe(1);
    expect(f.health.getHealthUiComponentBounds()).toMatchObject({ width: 30, height: 14 });
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
    expect(f.scene.events.listenerCount(Phaser.Scenes.Events.UPDATE)).toBe(0);
  });

  it("keeps construction, vision, frame and container visibility gates and cleans up subscriptions/timers", () => {
    const construction = { isFinished: false, constructionStateChanged: new Subject<void>() };
    const vision = { visibilityByCurrentPlayer: true };
    jest.mocked(getActorComponent).mockImplementation((_actor, token) => {
      if (token === ConstructionSiteComponent) return construction as never;
      if (token === VisionComponent) return vision as never;
      return undefined;
    });
    const f = fixture({ maxHealth: 100, healthDisplayBehavior: "onDamage" }), visible = jest.fn();
    f.health.uiComponentsVisibilityChanged.subscribe(visible); ready(f);
    expect(construction.constructionStateChanged.observed).toBe(true);
    f.health.takeDamage(1, DamageType.Physical);
    expect(f.health.getHealthUiComponentBounds().width).toBe(0);
    construction.isFinished = true; construction.constructionStateChanged.next();
    expect(visible).toHaveBeenLastCalledWith(true);
    vision.visibilityByCurrentPlayer = false; f.scene.events.emit(Phaser.Scenes.Events.UPDATE);
    expect(visible).toHaveBeenLastCalledWith(false);
    vision.visibilityByCurrentPlayer = true; f.actor.emit(ContainerComponent.GameObjectVisibilityChanged, true);
    expect(visible).toHaveBeenLastCalledWith(true);
    f.timers.find((timer) => timer.ms === 3000)?.callback();
    expect(visible).toHaveBeenLastCalledWith(false);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
    expect(construction.constructionStateChanged.observed).toBe(false);
    expect(f.timers.find((timer) => timer.ms === 3000)?.remove).toHaveBeenCalled();
    expect(f.actor.listenerCount(ContainerComponent.GameObjectVisibilityChanged)).toBe(0);
  });

  it("keeps armor-first damage, poison suppression, blood/heal coordinates and delayed visual tint cleanup", () => {
    const sound = jest.fn(), effect = { setDepth: jest.fn(), setScale: jest.fn(), setTint: jest.fn() };
    jest.mocked(getActorComponent).mockImplementation((_actor, token) => {
      if (token === AudioActorComponent) return { playCustomSound: sound } as never;
      if (token === ActorTranslateComponent) return { renderedTransform: { x: 12, y: 34 } } as never;
      if (token === VisionComponent) return { visibilityByCurrentPlayer: true } as never;
      return undefined;
    });
    jest.mocked(EffectsAnims.createAndPlayBloodAnimation).mockReturnValue(effect as never);
    jest.mocked(EffectsAnims.createAndPlayEffectAnimation).mockReturnValue(effect as never);
    const f = fixture({ maxHealth: 100, maxArmour: 2, physicalState: ActorPhysicalType.Biological }); ready(f);
    f.health.takeDamage(5, DamageType.Physical); expect(f.health.getData()).toEqual({ health: 100, armour: 0 });
    expect(EffectsAnims.createAndPlayBloodAnimation).not.toHaveBeenCalled();
    f.health.takeDamage(5, DamageType.Poison); expect(EffectsAnims.createAndPlayBloodAnimation).not.toHaveBeenCalled();
    f.health.takeDamage(5, DamageType.Physical);
    expect(EffectsAnims.createAndPlayBloodAnimation).toHaveBeenCalledWith(f.scene, 12, 34);
    f.health.heal(2); expect(EffectsAnims.createAndPlayEffectAnimation).toHaveBeenCalledWith(f.scene, "heal", 12, 11);
    expect(effect.setDepth).toHaveBeenCalledWith(8); expect(effect.setTint).toHaveBeenCalledWith(0x00ff00);
    f.health.setHealthDefinition({ maxHealth: 100, physicalState: ActorPhysicalType.Structural });
    f.health.takeDamage(1, DamageType.Physical); expect(f.actor.setTint).toHaveBeenCalledWith(0xff0000);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
    const tintTimer = f.timers.find((timer) => timer.ms === 500);
    expect(tintTimer?.remove).not.toHaveBeenCalled(); tintTimer?.callback();
    expect(f.actor.clearTint).toHaveBeenCalled();
  });

  it("retains native death order, hidden fallback and simulation destruction delay separate from presentation", () => {
    const f = fixture({ maxHealth: 100 }), order: string[] = []; ready(f);
    f.health.healthChanged.subscribe(() => order.push("health"));
    f.scene.events.on(HealthComponent.KilledEvent, () => order.push("scene"));
    f.actor.on(HealthComponent.KilledEvent, () => order.push("actor"));
    f.health.killActor(); expect(order).toEqual(["health", "scene", "actor"]);
    expect(f.health.hidden).toBe(true); expect(f.actor.setVisible).toHaveBeenCalledWith(false);
    expect(FadeOutComponent).toHaveBeenCalledWith(f.actor, { durationBeforeFadeOutMs: 25000, fadeOutDurationMs: 5000 });
    const delay = jest.mocked(CancelableSimDelay).mock.calls[0]; expect(delay[1]).toBe(30000);
    delay[2](); expect(f.actor.destroy).toHaveBeenCalledTimes(1);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
    expect(jest.mocked(CancelableSimDelay).mock.results[0].value.remove).toHaveBeenCalled();
  });

  it("silent death suppresses reactions and destroys immediately; invalid actors remain untouched", () => {
    const f = fixture({ maxHealth: 100 }); ready(f);
    f.health.destroyActorSilently(); expect(f.health.killed).toBe(true); expect(f.actor.destroy).toHaveBeenCalledTimes(1);
    expect(CancelableSimDelay).not.toHaveBeenCalled(); expect(FadeOutComponent).not.toHaveBeenCalled();
    expect(EffectsAnims.createAndPlayBloodAnimation).not.toHaveBeenCalled();
    f.actor.active = false; f.health.resetHealth(); f.health.killActor(); f.health.destroyActorSilently();
    expect(f.health.alive).toBe(true); expect(f.actor.destroy).toHaveBeenCalledTimes(1);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });
});
