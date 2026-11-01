import Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import WaterSeagull from "./WaterSeagull";

jest.mock("../../../core/probable-waffle.scene", () => ({ ProbableWaffleScene: class {} }));
jest.mock("../../../world/services/ActorIndexSystem", () => ({ ActorIndexSystem: class {} }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../world/services/depth.helper", () => ({ DepthHelper: { setActorDepth: jest.fn() } }));

describe("WaterSeagull lifecycle", () => {
  function setup(gameScene = true) {
    Object.assign(Phaser, { Animations: { Events: { ANIMATION_COMPLETE_KEY: "animationcomplete-" } } });
    const events = new Map<string, () => void>();
    const reaction = { remove: jest.fn() };
    const timeout = { remove: jest.fn() };
    const tween = { stop: jest.fn() };
    const addEvent = jest.fn().mockReturnValue(reaction);
    const delayedCall = jest.fn().mockReturnValue(timeout);
    const addTween = jest.fn().mockReturnValue(tween);
    const scene = Object.assign(gameScene ? new ProbableWaffleScene() : {}, {
      time: { addEvent, delayedCall },
      tweens: { add: addTween },
      events: { once: jest.fn(), off: jest.fn() },
      cameras: { main: { worldView: { left: 0, right: 1000, top: 0 } } }
    });
    Object.assign(Phaser.GameObjects.Sprite.prototype, {
      once: jest.fn((key: string, callback: () => void) => events.set(key, callback)),
      off: jest.fn((key: string) => events.delete(key)),
      setFlipX(this: Phaser.GameObjects.Sprite, flip: boolean) {
        this.flipX = flip;
      },
      destroy: jest.fn(),
      play: jest.fn()
    });
    const bird = new WaterSeagull(scene as unknown as Phaser.Scene, 100, 100);
    bird.active = true;
    const poll = () => addEvent.mock.calls[0][0].callback();
    const complete = () => events.get(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + "bird-fly-off")?.();
    return { bird, scene, poll, complete, reaction, timeout, tween, delayedCall, addTween };
  }

  beforeEach(() => jest.clearAllMocks());

  it("idles safely without a game scene or actor index", () => {
    const preview = setup(false);
    expect(() => preview.poll()).not.toThrow();
    jest.mocked(getSceneService).mockReturnValue(undefined);
    const game = setup();
    game.poll();
    expect(game.addTween).not.toHaveBeenCalled();
    preview.bird.destroy();
    game.bird.destroy();
  });

  it("filters actor type, activity and distance before taking off once away from the shark", () => {
    const state = setup();
    const shark = Object.assign(
      new Phaser.GameObjects.Sprite(state.scene as unknown as Phaser.Scene, 200, 100, "animals"),
      {
        active: true,
        name: ObjectNames.Shark
      }
    );
    jest.mocked(getSceneService).mockReturnValue({ getAllIdActors: () => [shark] });
    shark.active = false;
    state.poll();
    shark.active = true;
    shark.name = ObjectNames.TivaraWorker;
    state.poll();
    shark.name = ObjectNames.Shark;
    shark.x = 500;
    state.poll();
    expect(state.delayedCall).not.toHaveBeenCalled();
    shark.x = 200;
    state.poll();
    state.poll();
    expect(state.reaction.remove).toHaveBeenCalledTimes(1);
    expect(state.delayedCall).toHaveBeenCalledTimes(1);
    state.complete();
    state.complete();
    expect(state.addTween).toHaveBeenCalledTimes(1);
    expect(state.addTween.mock.calls[0][0]).toMatchObject({ x: -380, y: -60 });
    state.bird.destroy();
    state.bird.destroy();
    expect(state.timeout.remove).toHaveBeenCalledTimes(1);
    expect(state.tween.stop).toHaveBeenCalledTimes(1);
    expect(state.scene.events.off).toHaveBeenCalledTimes(1);
  });

  it("cleans up idle polling on scene shutdown", () => {
    const state = setup();
    const shutdown = state.scene.events.once.mock.calls[0];
    shutdown[1].call(shutdown[2]);
    expect(state.reaction.remove).toHaveBeenCalledTimes(1);
    expect(state.scene.events.off).toHaveBeenCalledTimes(1);
  });
});
