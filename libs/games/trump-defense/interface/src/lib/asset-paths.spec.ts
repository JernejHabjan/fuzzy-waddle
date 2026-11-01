import { loadLevel } from "./asset-paths";

describe("loadLevel", () => {
  const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");

  beforeEach(() => {
    Object.defineProperty(globalThis, "fetch", { configurable: true, value: jest.fn() });
  });

  afterEach(() => {
    if (originalFetch) Object.defineProperty(globalThis, "fetch", originalFetch);
    else Reflect.deleteProperty(globalThis, "fetch");
  });

  it("rejects a missing shipped level", async () => {
    jest.mocked(fetch).mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(loadLevel(2)).rejects.toThrow("Level 2 could not load (404)");
  });

  it("rejects stale level data before constructing a scene", async () => {
    jest.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ version: 2, id: 1, scene: {}, paths: {}, rules: {} })
    } as Response);
    await expect(loadLevel(1)).rejects.toThrow("unsupported or incomplete format");
  });
});
