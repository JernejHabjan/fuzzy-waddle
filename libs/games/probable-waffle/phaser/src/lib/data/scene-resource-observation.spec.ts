import type Phaser from "phaser";
import { fenceSceneResourceHistory, subscribeSceneResourceLoss } from "./scene-resource-observation";

describe("passive scene resource history fence", () => {
  it("has no native work without subscribers and isolates exceptions before later observers", () => {
    const scene = {} as Phaser.Scene, later = jest.fn();
    expect(() => fenceSceneResourceHistory(scene, "resource_actor_owner_change")).not.toThrow();
    const removeThrow = subscribeSceneResourceLoss(scene, () => { throw new Error("observer"); });
    const removeLater = subscribeSceneResourceLoss(scene, later);
    fenceSceneResourceHistory(scene, "resource_actor_owner_change");
    expect(later).toHaveBeenCalledWith("resource_actor_owner_change");
    removeThrow(); removeLater(); removeLater();
    fenceSceneResourceHistory(scene, "resource_actor_owner_change"); expect(later).toHaveBeenCalledTimes(1);
  });

  it("isolates scene ownership and keeps the existing bounded subscription budget", () => {
    const scene = {} as Phaser.Scene, other = {} as Phaser.Scene;
    const callbacks = Array.from({ length: 8 }, () => jest.fn());
    const cleanup = callbacks.map((callback) => subscribeSceneResourceLoss(scene, callback));
    const overflow = jest.fn(), foreign = jest.fn();
    const removeOverflow = subscribeSceneResourceLoss(scene, overflow), removeForeign = subscribeSceneResourceLoss(other, foreign);
    expect(overflow).toHaveBeenCalledWith("scene_resource_listener_overflow");
    fenceSceneResourceHistory(scene, "resource_actor_owner_change");
    expect(callbacks.every((callback) => callback.mock.calls.length === 1)).toBe(true);
    expect(overflow).toHaveBeenCalledTimes(1); expect(foreign).not.toHaveBeenCalled();
    cleanup.forEach((remove) => remove()); removeOverflow(); removeForeign();
  });
});
