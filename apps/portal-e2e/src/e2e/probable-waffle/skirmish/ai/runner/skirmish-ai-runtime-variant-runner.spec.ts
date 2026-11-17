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
