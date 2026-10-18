import { CampaignOwnedResourceRegistry } from "./campaign-owned-resource-registry";

describe("CampaignOwnedResourceRegistry", () => {
  it("releases matching resources in stable order and reports leaks", () => {
    const cleanup: string[] = [];
    const registry = new CampaignOwnedResourceRegistry();
    registry.register("phase:a", "z-lock", (reason) => cleanup.push(`z:${reason}`));
    registry.register("phase:a", "a-lock", (reason) => cleanup.push(`a:${reason}`));

    expect(registry.release("phase:a", ["z-lock", "missing", "a-lock"], "phase-exited")).toEqual(["missing"]);
    expect(cleanup).toEqual(["a:phase-exited", "z:phase-exited"]);
    expect(registry.has("a-lock")).toBe(false);
  });

  it("cleans every remaining resource on scene shutdown", () => {
    const cleanup = jest.fn();
    const registry = new CampaignOwnedResourceRegistry();
    registry.register("mission:a", "modifier", cleanup);

    registry.destroy();

    expect(cleanup).toHaveBeenCalledWith("scene-shutdown");
    expect(registry.has("modifier")).toBe(false);
  });

  it("rejects cross-owner resource collisions", () => {
    const registry = new CampaignOwnedResourceRegistry();
    registry.register("phase:a", "lock", jest.fn());
    expect(() => registry.register("phase:b", "lock", jest.fn())).toThrow("already owned");
  });

  it("drops a failed cleanup registration after reporting the leak", () => {
    const registry = new CampaignOwnedResourceRegistry();
    registry.register("phase:a", "broken", () => {
      throw new Error("cleanup failed");
    });

    expect(registry.release("phase:a", ["broken"], "phase-exited")).toEqual(["broken"]);
    expect(registry.has("broken")).toBe(false);
  });
});
