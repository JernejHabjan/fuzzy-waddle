import {
  advanceProcessedCommandSequence,
  isProcessedCommandSequence
} from "./command-authority-policy";

describe("command authority watermark policy", () => {
  it("rejects an old sequence even after its detailed command id was evicted", () => {
    expect(isProcessedCommandSequence(41, 42)).toBe(true);
    expect(isProcessedCommandSequence(42, 42)).toBe(true);
    expect(isProcessedCommandSequence(43, 42)).toBe(false);
  });

  it("never moves the processed frontier backwards during restore or duplicate delivery", () => {
    expect(advanceProcessedCommandSequence(42, 7)).toBe(42);
    expect(advanceProcessedCommandSequence(42, 43)).toBe(43);
  });
});
