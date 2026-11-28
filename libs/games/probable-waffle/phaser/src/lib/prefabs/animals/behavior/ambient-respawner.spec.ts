import Phaser from "phaser";
import { AmbientRespawner } from "./ambient-respawner";

describe("AmbientRespawner", () => {
  it("respawns after destruction and cancels the next spawn on shutdown", () => {
    const originalEvents = Phaser.GameObjects.Events;
    Object.assign(Phaser.GameObjects, { Events: { DESTROY: "destroy" } });
    const handlers = new Map<string, () => void>();
    const timer = { remove: jest.fn() };
    const scene = {
      events: {
        once: jest.fn((_event: string, callback: () => void, context: unknown) => {
          handlers.set("shutdown", () => callback.call(context));
        })
      },
      time: {
        delayedCall: jest.fn((_delay: number, callback: () => void) => {
          handlers.set("spawn", callback);
          return timer;
        })
      }
    };
    const object = {
      once: jest.fn((_event: string, callback: () => void) => handlers.set("destroy", callback))
    };
    const spawn = jest.fn(() => object);
    jest.spyOn(Phaser.Math, "Between").mockReturnValue(100);
    try {
      new AmbientRespawner(scene as unknown as Phaser.Scene, object as never, spawn as never, 100, 200);
      handlers.get("destroy")?.();
      expect(scene.time.delayedCall).toHaveBeenCalledWith(100, expect.any(Function));
      handlers.get("spawn")?.();
      expect(spawn).toHaveBeenCalledTimes(1);
      handlers.get("destroy")?.();
      handlers.get("shutdown")?.();
      expect(timer.remove).toHaveBeenCalledWith(false);
      handlers.get("spawn")?.();
      expect(spawn).toHaveBeenCalledTimes(1);
    } finally {
      Object.assign(Phaser.GameObjects, { Events: originalEvents });
      jest.restoreAllMocks();
    }
  });
});
