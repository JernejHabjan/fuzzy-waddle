import Phaser from "phaser";
import { Subject } from "rxjs";
import { OwnerComponent } from "./owner-component";
import { OwnerPresentation } from "./owner-presentation";
import { HealthComponent } from "./combat/components/health-component";
import { ActorTranslateComponent } from "./movement/actor-translate-component";
import { ContainerComponent } from "./building/container-component";
import { ConstructionSiteComponent } from "./construction/construction-site-component";
import { VisionComponent } from "./vision-component";
import { getActorComponent } from "../../data/actor-component";
import { onObjectReady, getGameObjectDepth } from "../../data/game-object-helper";
import { getSceneService } from "../../world/services/scene-component-helpers";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../data/game-object-helper", () => ({ onObjectReady: jest.fn(), getGameObjectDepth: jest.fn() }));
jest.mock("../../data/player-relation", () => ({ arePlayersAllied: jest.fn() }));
jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../world/services/ActorIndexSystem", () => ({ ActorIndexSystem: class {} }));
jest.mock("../../world/scenes/GameProbableWaffleScene", () => ({ __esModule: true, default: class {} }));
jest.mock("../../world/services/lighting/scene-lighting.service", () => ({ SceneLightingService: class {} }));
jest.mock("../../world/services/lighting/lighting-game-object-meta", () => ({ markGameObjectAmbientResponsive: jest.fn() }));
jest.mock("./combat/components/health-component", () => ({ HealthComponent: class { static KilledEvent = "killed"; } }));
jest.mock("./movement/actor-translate-component", () => ({ ActorTranslateComponent: class {} }));
jest.mock("./building/container-component", () => ({
  ContainerComponent: class { static GameObjectVisibilityChanged = "visibility"; }
}));
jest.mock("./construction/construction-site-component", () => ({ ConstructionSiteComponent: class {} }));
jest.mock("./vision-component", () => ({ VisionComponent: class {} }));

function fixture() {
  const events = new Phaser.Events.EventEmitter(), actorEvents = new Phaser.Events.EventEmitter();
  const rings: Array<ReturnType<typeof ring>> = [];
  function ring() {
    return { fillStyle: jest.fn(), fillRect: jest.fn(), setDepth: jest.fn(), setVisible: jest.fn(),
      destroy: jest.fn(), x: 0, y: 0 };
  }
  const scene = { events, plugins: { get: jest.fn() }, add: { graphics: () => {
    const value = ring(); rings.push(value); return value;
  } }, tweens: { chain: jest.fn() } };
  const actor = Object.assign(actorEvents, { scene, setTint: jest.fn(), clearTint: jest.fn() });
  const definition = { color: [] };
  const owner = new OwnerComponent(actor as unknown as Phaser.GameObjects.GameObject, definition);
  return { scene, actor, owner, rings, definition };
}

describe("owner facade and visual lifecycle (authored; final gate pending)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getActorComponent).mockReturnValue(undefined);
    jest.mocked(getSceneService).mockReturnValue(undefined);
    OwnerComponent.useColorReplace = false;
  });

  it("retains definition, serialization, no-op and index-before-owner-before-visual-before-event ordering", () => {
    const f = fixture(), order: string[] = [];
    jest.mocked(getSceneService).mockReturnValue({ updateActorOwnership: (_actor: unknown, old: number, next: number) => {
      expect(f.owner.getOwner()).toBeUndefined(); expect(old).toBeUndefined(); expect(next).toBe(2); order.push("index");
    } } as never);
    const visuals = jest.spyOn(OwnerPresentation.prototype, "tryToSetComponents").mockImplementation(() => {
      expect(f.owner.getOwner()).toBe(2); order.push("visual");
    });
    f.actor.on(OwnerComponent.OwnerChangedEvent, (old, next) => {
      expect([old, next]).toEqual([undefined, 2]); order.push("event");
    });
    f.owner.setData({ ownerId: 2 });
    f.owner.setOwner(2); f.owner.setData({ ownerId: undefined });
    expect(order).toEqual(["index", "visual", "event"]);
    expect(f.owner.ownerDefinition).toBe(f.definition); expect(f.owner.getData()).toEqual({ ownerId: 2 });
    visuals.mockRestore();
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("preserves index throws without assignment, visual work or owner events", () => {
    const f = fixture(), event = jest.fn(), error = new Error("index");
    f.actor.on(OwnerComponent.OwnerChangedEvent, event);
    jest.mocked(getSceneService).mockReturnValue({ updateActorOwnership: () => { throw error; } } as never);
    expect(() => f.owner.setOwner(2)).toThrow(error);
    expect(f.owner.getOwner()).toBeUndefined(); expect(event).not.toHaveBeenCalled();
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("supports eager ready, public color, initial conversion blink and explicit clear visual cleanup", () => {
    jest.mocked(onObjectReady).mockImplementation((_actor, callback, context) => callback.call(context));
    const f = fixture(), color = new Phaser.Display.Color(1, 2, 3);
    f.owner.ownerColor = color; expect(f.owner.ownerColor).toBe(color);
    f.owner.setOwnerWithBlink(2); f.owner.setOwnerWithBlink(2); f.owner.setOwnerWithBlink(3);
    expect(f.scene.tweens.chain).toHaveBeenCalledTimes(1);
    f.owner.clearOwner(); expect(f.owner.getOwner()).toBeUndefined();
    f.actor.emit(HealthComponent.KilledEvent);
    expect(f.scene.events.listenerCount(Phaser.Scenes.Events.UPDATE)).toBe(0);
    expect(f.actor.listenerCount(ContainerComponent.GameObjectVisibilityChanged)).toBe(0);
    jest.mocked(onObjectReady).mockReset();
  });

  it("owns ring/frame/movement/health/construction subscriptions and keeps delayed color callbacks", () => {
    jest.useFakeTimers();
    const movement = new Subject<void>(), health = new Subject<boolean>(), construction = new Subject<void>();
    jest.mocked(onObjectReady).mockImplementation((_actor, callback, context) => callback.call(context));
    jest.mocked(getGameObjectDepth).mockReturnValue(7);
    jest.mocked(getActorComponent).mockImplementation((_actor, token) => {
      if (token === ActorTranslateComponent) return { actorMovedLogicalPosition: movement } as never;
      if (token === HealthComponent) return { uiComponentsVisibilityChanged: health,
        getHealthUiComponentBounds: () => ({ x: 10, y: 20, width: 30, height: 4 }) } as never;
      if (token === ConstructionSiteComponent) return { isFinished: false, constructionStateChanged: construction,
        constructionProgressUiComponent: { getBounds: () => ({ width: 40, height: 5 }) } } as never;
      if (token === VisionComponent) return { visibilityByCurrentPlayer: true } as never;
      return undefined;
    });
    const f = fixture(), applied = jest.fn();
    f.actor.on(OwnerComponent.OwnerColorAppliedEvent, applied);
    f.owner.ownerColor = new Phaser.Display.Color(1, 2, 3); f.owner.setOwner(2);
    expect(f.rings[0].fillRect).toHaveBeenCalledWith(0, 0, 44, 9);
    expect(f.rings[0].setDepth).toHaveBeenCalledWith(8);
    movement.next(); health.next(true); construction.next();
    f.scene.events.emit(Phaser.Scenes.Events.UPDATE);
    expect(f.rings.at(-1)?.setVisible).toHaveBeenCalledWith(true);
    f.actor.emit(ContainerComponent.GameObjectVisibilityChanged, false);
    expect(f.rings.at(-1)?.setVisible).toHaveBeenCalledWith(false);
    f.actor.emit(HealthComponent.KilledEvent); f.actor.emit(Phaser.GameObjects.Events.DESTROY);
    expect(movement.observed || health.observed || construction.observed).toBe(false);
    expect(f.rings.every((value) => value.destroy.mock.calls.length === 1)).toBe(true);
    jest.runOnlyPendingTimers(); expect(applied).toHaveBeenCalledWith(f.owner.ownerColor);
    jest.useRealTimers(); jest.mocked(onObjectReady).mockReset();
  });
  it("retains opt-in pipeline setup/removal and definition color references", () => {
    OwnerComponent.useColorReplace = true;
    const plugin = { add: jest.fn(() => ({ name: "pipeline" })), remove: jest.fn() };
    const events = new Phaser.Events.EventEmitter(), actor = new Phaser.Events.EventEmitter();
    const scene = { events, plugins: { get: jest.fn(() => plugin) } };
    Object.assign(actor, { scene });
    const definition = { color: [{ originalColor: 1, epsilon: 0.1 }] };
    jest.mocked(onObjectReady).mockImplementation((_actor, callback, context) => callback.call(context));
    const owner = new OwnerComponent(actor as unknown as Phaser.GameObjects.GameObject, definition);
    owner.ownerColor = new Phaser.Display.Color(1, 2, 3); owner.setOwner(2);
    expect(plugin.add).toHaveBeenCalledWith(actor, expect.objectContaining({ originalColor: 1, epsilon: 0.1,
      newColor: owner.ownerColor.color }));
    actor.emit(Phaser.GameObjects.Events.DESTROY);
    expect(plugin.remove).toHaveBeenCalledWith(actor, "pipeline");
    expect(events.listenerCount(Phaser.Scenes.Events.UPDATE)).toBe(0);
    jest.mocked(onObjectReady).mockReset(); OwnerComponent.useColorReplace = false;
  });

});
