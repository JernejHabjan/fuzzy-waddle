import { isProbableWafflePlayerPreferences } from "./player-preferences";

describe("isProbableWafflePlayerPreferences", () => {
  it("rejects malformed persisted values", () => {
    expect(isProbableWafflePlayerPreferences({ version: 1, showFps: true })).toBe(false);
  });
});
