import { expect, test, type Browser } from "@playwright/test";
import { EventEmitter } from "node:events";
import type { RuntimeFixture } from "../contracts/skirmish-ai-runtime-fixture";
import type { RuntimeVariant } from "../setup/skirmish-ai-runtime-variant";
import { nativeEvidenceCheckpoints } from "../evaluation/scenario/skirmish-ai-native-proof-window";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";

test("a focused control shares the watchdog without an early success checkpoint", () => {
  const fixture = {
    recipe: { fixedStepFrames: true },
    assertions: { "PRO-05": { requiredNativeScenario: { branchByVariant: { subject: "loss", control: "served" } } } }
  } as unknown as RuntimeFixture;
  const subject = {
    id: "subject",
    executionKind: "focused_preset",
    role: "subject",
    captureConstruction: true
  } as const;

  expect(nativeEvidenceCheckpoints("PRO-05", fixture, subject as RuntimeVariant)?.length).toBeGreaterThan(0);
  expect(
    nativeEvidenceCheckpoints("PRO-05", fixture, { ...subject, id: "control", role: "control" } as RuntimeVariant)
  ).toEqual([]);
  expect(
    nativeEvidenceCheckpoints("PRO-05", fixture, { ...subject, requiresMultiplayer: true } as RuntimeVariant)
  ).toBeUndefined();
});

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

test("reports a fatal preset setup error and tears down the waiting context", async () => {
  const page = new EventEmitter();
  let closed = false;
  const browser = {
    newContext: async () => ({
      newPage: async () => page,
      close: async () => {
        closed = true;
      }
    })
  } as unknown as Browser;
  const failure = "runtime_construction_not_applied:contact-group:rejected:illegal_site:invalid_footprint";
  await expect(
    runVariant(
      browser,
      {} as RuntimeFixture,
      { seed: 1 } as RuntimeVariant,
      null,
      [],
      "revision",
      "digest",
      undefined,
      undefined,
      async () => {
        page.emit("pageerror", new Error(failure));
        await new Promise<void>(() => undefined);
      }
    )
  ).rejects.toThrow(failure);
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
  ).rejects.toThrow("runtime_focused_variant_timeout:bounded-variant:phase=variant_setup:tick=0:budget_ms=10");
  expect(closed).toBe(true);
});
