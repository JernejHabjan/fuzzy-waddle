import Phaser from "phaser";
import { AmbientRespawner } from "./ambient-respawner";

describe("AmbientRespawner", () => {
  it("respawns after destruction and cancels the next spawn on shutdown", () => {
    let shutdown: (() => void) | undefined;
    let destroyed: (() => void) | undefined;
    let spawnCallback: (() => void) | undefined;
    const timer = { remove: jest.fn() };
    const scene = {
      events: { once: jest.fn((_event: string, callback: () => void, context: unknown) => { shutdown = () => callback.call(context); }) },
      time: { delayedCall: jest.fn((_delay: number, callback: () => void) => { spawnCallback = callback; return timer; }) }
    };
    const object = { once: jest.fn((_event: string, callback: () => void) => { destroyed = callback; }) };
    const spawn = jest.fn(() => object);
    jest.spyOn(Phaser.Math, "Between").mockReturnValue(100);
    new AmbientRespawner(scene as unknown as Phaser.Scene, object as never, spawn as never, 100, 200);
    destroyed?.();
    expect(scene.time.delayedCall).toHaveBeenCalledWith(100, expect.any(Function));
    spawnCallback?.();
    expect(spawn).toHaveBeenCalledTimes(1);
    destroyed?.();
    shutdown?.();
    expect(timer.remove).toHaveBeenCalledWith(false);
    spawnCallback?.();
    expect(spawn).toHaveBeenCalledTimes(1);
    jest.restoreAllMocks();
  });
});
