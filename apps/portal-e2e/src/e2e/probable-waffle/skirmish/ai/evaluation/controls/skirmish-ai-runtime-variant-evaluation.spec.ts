import { expect, test } from "@playwright/test";
import { requiresSurvivingWorker } from "./skirmish-ai-runtime-variant-evaluation";

test.describe("runtime worker survival oracle", () => {
  test("allows only the authored STRAT-09 unrecoverable branches to end without a worker", () => {
    expect(requiresSurvivingWorker("STRAT-09", "strat-09-tivara-unrecoverable")).toBe(false);
    expect(requiresSurvivingWorker("STRAT-09", "strat-09-skaduwee-unrecoverable")).toBe(false);
    expect(requiresSurvivingWorker("STRAT-09", "strat-09-tivara-denial")).toBe(true);
    expect(requiresSurvivingWorker("STRAT-09", "strat-09-tivara-raid")).toBe(true);
    expect(requiresSurvivingWorker("STRAT-10", "strat-10-tivara-unrecoverable")).toBe(true);
  });
});
