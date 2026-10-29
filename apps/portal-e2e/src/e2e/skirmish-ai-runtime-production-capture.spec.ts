import { expect, test } from "@playwright/test";
import { captureRuntimeProductionAuthority } from "./skirmish-ai-runtime-production-capture";

test("native production capture streams large JSON into gzip without stringify of the full record", async ({ page }) => {
  await page.evaluate(() => {
    const record = {
      schemaVersion: 1,
      kind: "runtime_production_capture",
      playerNumber: 2,
      startedTick: 0,
      facts: Array.from({ length: 12000 }, (_, sequence) => ({
        sequence,
        tick: sequence % 2401,
        kind: "decision_selected",
        detail: { actorId: `actor-${sequence % 40}`, value: sequence % 17 }
      })),
      gaps: [],
      recipientResourceFacts: [{ owner: 2, amount: 500 }]
    };
    const originalStringify = JSON.stringify;
    let objectStringifyAttempts = 0;
    JSON.stringify = ((value: unknown, ...args: Parameters<typeof JSON.stringify>) => {
      if (value !== null && typeof value === "object") {
        objectStringifyAttempts += 1;
        throw new Error("full_capture_json_materialized");
      }
      return originalStringify.call(JSON, value, ...args);
    }) as typeof JSON.stringify;
    const host = window as unknown as Record<string, unknown>;
    host.__fuzzyWaddleAiRuntimeBrowserTestV1 = {
      productionCapture: { capture: () => record }
    };
    host.__captureSerializerTest = {
      attempts: () => objectStringifyAttempts,
      restore: () => (JSON.stringify = originalStringify)
    };
  });

  const capture = await captureRuntimeProductionAuthority(page, 2, 2400);
  const objectStringifyAttempts = await page.evaluate(() => {
    const host = window as unknown as { __captureSerializerTest: { attempts(): number; restore(): void } };
    const attempts = host.__captureSerializerTest.attempts();
    host.__captureSerializerTest.restore();
    return attempts;
  });

  expect(objectStringifyAttempts).toBe(0);
  expect(capture.facts).toHaveLength(12000);
  expect(capture.facts[11999]).toMatchObject({ sequence: 11999, kind: "decision_selected" });
  expect(capture.recipientResourceFacts).toEqual([{ owner: 2, amount: 500 }]);
});
