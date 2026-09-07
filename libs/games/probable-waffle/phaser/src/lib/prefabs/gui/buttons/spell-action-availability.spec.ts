import { getSpellActionAvailability } from "./spell-action-availability";

describe("getSpellActionAvailability", () => {
  it("keeps an unresearched spell locked even when a stale cooldown remains", () => {
    expect(getSpellActionAvailability(false, 5_000)).toBe("locked");
  });

  it("renders a researched spell with an active timer as cooldown", () => {
    expect(getSpellActionAvailability(true, 1)).toBe("cooldown");
  });

  it("renders a researched spell with no timer as ready", () => {
    expect(getSpellActionAvailability(true, 0)).toBe("ready");
  });
});
