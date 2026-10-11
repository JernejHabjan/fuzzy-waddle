import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import Phaser from "phaser";
import { Subject } from "rxjs";
import { ConstructionStateEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ConstructionSiteDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";
import { ConstructionSiteComponent } from "./construction-site-component";
import { ConstructionPresentation } from "./construction-presentation";
import { ConstructionProgressUiComponent } from "./construction-progress-ui-component";
import { getActorComponent } from "../../../data/actor-component";
import { onObjectReady, getGameObjectVisibility } from "../../../data/game-object-helper";
import { upgradeFromConstructingToFullActorData } from "../../../data/actor-data";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AudioService } from "../../../world/services/audio.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { ProbableWaffleSceneEventName } from "../../../world/services/recovery/probable-waffle-scene-events";
import { HealthComponent } from "../combat/components/health-component";
import { startConstructionPayment, refundConstructionPayment } from "./construction-payment";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn(), getGameObjectVisibility: jest.fn() }));
jest.mock("../../../data/actor-data", () => ({ upgradeFromConstructingToFullActorData: jest.fn() }));
jest.mock("../../../data/actor-level-utils", () => ({ getResearchedLevelForActor: () => null }));
jest.mock("../../../prefabs/definitions/actor-definitions", () => ({ getPwActorDefinition: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../world/services/audio.service", () => ({ AudioService: class {} }));
jest.mock("./construction-progress-ui-component", () => ({ ConstructionProgressUiComponent: jest.fn() }));
jest.mock("./construction-payment", () => ({
  startConstructionPayment: jest.fn(),
  refundConstructionPayment: jest.fn()
}));

const policy = {
  startImmediately: false,
  consumesBuilders: false,
  maxAssignedBuilders: 1,
  maxAssignedRepairers: 1,
  progressMadeAutomatically: 1,
  progressMadePerBuilder: 1,
  repairFactor: 1,
  initialHealthPercentage: 0.1,
  refundFactor: 0.5,
  canBeDragPlaced: false
} satisfies ConstructionSiteDefinition;

function fixture(eager: boolean) {
  const order: string[] = [],
    ticks = new Subject<number>();
  const scene = { events: new Phaser.Events.EventEmitter() };
  const actor = Object.assign(new Phaser.Events.EventEmitter(), { scene, name: "site" });
  const health = {
    healthDefinition: { maxHealth: 100 },
    healthComponentData: { health: 100, armour: 0 },
    killed: false
  };
  const audio = { playSpatialAudioSprite: jest.fn<void, Parameters<AudioService["playSpatialAudioSprite"]>>() };
  jest
    .mocked(getPwActorDefinition)
    .mockReturnValue({ components: { productionCost: { productionTime: 1000 } } } as never);
  jest.mocked(ConstructionProgressUiComponent).mockImplementation(() => {
    order.push("ui");
    return {} as never;
  });
  jest.mocked(getActorComponent).mockImplementation((_actor, token) => {
    if (token === HealthComponent) {
      order.push("health");
      return health as never;
    }
    return undefined;
  });
  jest.mocked(getSceneService).mockImplementation((_scene, token) => {
    if (token === AudioService) {
      order.push("audio");
      return audio as never;
    }
    if (token === SimulationTickService) {
      order.push("ticks");
      return { tick$: ticks } as never;
    }
    return undefined;
  });
  if (eager) jest.mocked(onObjectReady).mockImplementation((_actor, callback, scope) => callback.call(scope));
  const component = new ConstructionSiteComponent(actor as unknown as Phaser.GameObjects.GameObject, policy);
  const ready = () => {
    const call = requireAiTestEntry(jest.mocked(onObjectReady).mock.calls, 0);
    if (!call) throw new Error("ready_missing");
    call[1].call(call[2]);
  };
  return { actor, scene, component, health, audio, order, ticks, ready };
}

describe("construction sound extraction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(onObjectReady).mockReset();
    jest.mocked(getGameObjectVisibility).mockReturnValue({ visible: true } as never);
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([true, false])("preserves %s eager ready and the UI/health/audio/cache/tick order", (eager) => {
    const f = fixture(eager);
    if (!eager) {
      expect(f.order).toEqual(["ui", "ticks"]);
      f.ready();
    }
    expect(f.order).toEqual(
      eager ? ["ui", "health", "audio", "health", "ticks"] : ["ui", "ticks", "health", "audio", "health"]
    );
    expect(f.health.healthComponentData.health).toBe(10);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
    expect(f.ticks.observed).toBe(false);
  });

  it("shares restored flag, sets it before native play, and retains callbacks after teardown", () => {
    const f = fixture(true);
    f.component.setData({ playingBuildSound: true });
    f.component.startConstruction();
    f.component.update();
    expect(f.audio.playSpatialAudioSprite).not.toHaveBeenCalled();
    f.component.setData({ playingBuildSound: false });
    f.audio.playSpatialAudioSprite.mockImplementation(() => expect(f.component.getData().playingBuildSound).toBe(true));
    f.component.update();
    expect(f.audio.playSpatialAudioSprite).toHaveBeenCalledTimes(1);
    const callback = requireAiTestEntry(f.audio.playSpatialAudioSprite.mock.calls, 0)[4]?.onComplete;
    if (!callback) throw new Error("synthetic_build_sound_completion_missing");
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
    callback();
    expect(f.component.getData().playingBuildSound).toBe(false);
    expect(refundConstructionPayment).toHaveBeenCalledTimes(1);
  });

  it("keeps missing audio, missing visibility, hidden and already-playing build guards before RNG", () => {
    const actor = {} as Phaser.GameObjects.GameObject,
      read = jest.fn(() => false),
      write = jest.fn();
    const helper = new ConstructionPresentation(actor, read, write),
      random = jest.spyOn(Math, "random");
    helper.playBuildSound();
    expect(getGameObjectVisibility).not.toHaveBeenCalled();
    const audio = { playSpatialAudioSprite: jest.fn() };
    jest.mocked(getSceneService).mockReturnValue(audio as never);
    helper.init();
    jest.mocked(getGameObjectVisibility).mockReturnValue(null);
    helper.playBuildSound();
    jest.mocked(getGameObjectVisibility).mockReturnValue({ visible: false } as never);
    helper.playBuildSound();
    expect(read).not.toHaveBeenCalled();
    jest.mocked(getGameObjectVisibility).mockReturnValue({ visible: true } as never);
    read.mockReturnValue(true);
    helper.playBuildSound();
    expect(random).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it("retains flag on native audio failure and completion RNG without audio", () => {
    const f = fixture(true),
      error = new Error("audio");
    f.audio.playSpatialAudioSprite.mockImplementation(() => {
      throw error;
    });
    f.component.startConstruction();
    expect(() => f.component.update()).toThrow(error);
    expect(f.component.getData().playingBuildSound).toBe(true);
    const random = jest.spyOn(Math, "random").mockReturnValue(0);
    const helper = new ConstructionPresentation(
      f.actor as unknown as Phaser.GameObjects.GameObject,
      () => false,
      () => undefined
    );
    helper.playCompletionSound();
    expect(random).toHaveBeenCalledTimes(1);
    jest.mocked(getGameObjectVisibility).mockReturnValue({ visible: false } as never);
    helper.playCompletionSound();
    expect(random).toHaveBeenCalledTimes(1);
  });

  it("retains completion state/sound/builder/upgrade/score order and the finished guard", () => {
    const f = fixture(true),
      order: string[] = [],
      builder = { destroy: () => order.push("builder") };
    const consumes = { ...policy, consumesBuilders: true };
    const component = new ConstructionSiteComponent(f.actor as unknown as Phaser.GameObjects.GameObject, consumes);
    component.assignBuilder(builder as unknown as Phaser.GameObjects.GameObject);
    component.constructionStateChanged.subscribe((state) => {
      expect(state).toBe(ConstructionStateEnum.Finished);
      order.push("state");
    });
    f.audio.playSpatialAudioSprite.mockImplementation(() => order.push("sound"));
    jest.mocked(upgradeFromConstructingToFullActorData).mockImplementation(() => {
      order.push("upgrade");
    });
    f.scene.events.on(ProbableWaffleSceneEventName.ScoreBuildingConstructed, () => order.push("score"));
    component.completeConstruction();
    component.completeConstruction();
    expect(order).toEqual(["state", "sound", "builder", "upgrade", "score"]);
    expect(startConstructionPayment).not.toHaveBeenCalled();
  });
});
