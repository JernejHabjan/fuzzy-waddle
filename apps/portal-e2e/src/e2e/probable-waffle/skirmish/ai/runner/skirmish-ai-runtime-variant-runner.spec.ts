import { expect, test, type Browser } from "@playwright/test";
import type { RuntimeFixture } from "../contracts/skirmish-ai-runtime-fixture";
import type { RuntimeVariant } from "../setup/skirmish-ai-runtime-variant";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";

test("closes the allocated context when creating its page fails", async () => {
  const failure = new Error("page_creation_failed");
  let closed = false;
  const browser = {
    newContext: async () => ({
      newPage: async () => {
        throw failure;
      },
      close: async () => {
        closed = true;
      }
    })
  } as unknown as Browser;

  await expect(
    runVariant(browser, {} as RuntimeFixture, { seed: 1 } as RuntimeVariant, null, [], "revision", "digest")
  ).rejects.toThrow("page_creation_failed");
  expect(closed).toBe(true);
});

test("a focused variant has its own deadline and closes a hung browser context", async () => {
  let closed = false;
  let cancelPage: ((reason: Error) => void) | undefined;
  const browser = {
    newContext: async () => ({
      newPage: () =>
        new Promise((_, reject) => {
          cancelPage = reject;
        }),
      close: async () => {
        closed = true;
        cancelPage?.(new Error("context_closed"));
      }
    })
  } as unknown as Browser;
  const probe = { checkpoints: [20], wallClockBudgetMs: 10, failures: async () => ["missing_proof"] };
  await expect(
    runVariant(
      browser,
      {} as RuntimeFixture,
      { id: "bounded-variant", seed: 1 } as RuntimeVariant,
      null,
      [],
      "revision",
      "digest",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      probe
    )
  ).rejects.toThrow("runtime_focused_variant_timeout:bounded-variant:tick=0:budget_ms=10");
  expect(closed).toBe(true);
});
