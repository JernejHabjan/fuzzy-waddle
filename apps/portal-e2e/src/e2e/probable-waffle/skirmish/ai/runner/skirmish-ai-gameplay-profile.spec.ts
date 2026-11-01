import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prepareRuntimeVariant } from "../setup/skirmish-ai-runtime-variant-setup";
import { captureCheckpoint } from "../capture/skirmish-ai-runtime-checkpoint-capture";
import type { RuntimeFixture } from "../contracts/skirmish-ai-runtime-fixture";

test.skip(process.env.AI_GAMEPLAY_PROFILE !== "1", "Explicit real-time gameplay profiling only");
test.setTimeout(180_000);

for (let repetition = 1; repetition <= 3; repetition++) {
  test(`records rendered 1x AI opening sample ${repetition}`, async ({ page }) => {
    const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
    const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const fixture: RuntimeFixture = JSON.parse(
      readFileSync(
        join(
          root,
          "tools/probable-waffle/skirmish/ai/testing/fixtures/native/economy/opening-workforce-native-gameplay.json"
        ),
        "utf8"
      )
    );
    const variant = fixture.recipe.variants.find((candidate) => candidate.id === "tivara-no-worker-opening");
    if (!variant) throw new Error("profile_workload_missing");
    const errors: string[] = [];
    const fixtureDigest = `sha256:${createHash("sha256").update(JSON.stringify(fixture)).digest("hex")}`;
    await prepareRuntimeVariant(page, fixture, variant, variant.seed, source, fixtureDigest, true, errors);
    const before = await captureCheckpoint(page, fixture.recipe.aiPlayerNumber, 0);
    const frames = await page.evaluate(async (playerNumber) => {
      const parts = window.__fuzzyWaddleAiRuntimeParts?.(playerNumber);
      const host = window as unknown as {
        __fuzzyWaddleAiRuntimeBrowserTest?: {
          game: { loop: { wake(): void; sleep(): void } };
        };
      };
      const game = host.__fuzzyWaddleAiRuntimeBrowserTest?.game;
      if (!parts || !game) throw new Error("profile_runtime_missing");
      const deltas: number[] = [];
      let previous = performance.now();
      const started = previous;
      let active = true;
      let frame = 0;
      const sample = (now: number) => {
        if (!active) return;
        if (now - started >= 2000 && deltas.length < 6000) deltas.push(now - previous);
        previous = now;
        frame = requestAnimationFrame(sample);
      };
      parts.tickService.setSimulationTimeScale(1);
      parts.tickService.resumeTick("manual");
      game.loop.wake();
      frame = requestAnimationFrame(sample);
      try {
        await new Promise<void>((resolve) => setTimeout(resolve, 22_000));
      } finally {
        active = false;
        cancelAnimationFrame(frame);
        game.loop.sleep();
        parts.tickService.pauseTick("manual");
      }
      return { deltas, elapsedMs: performance.now() - started, tick: parts.tickService.currentTick };
    }, fixture.recipe.aiPlayerNumber);
    const after = await captureCheckpoint(page, fixture.recipe.aiPlayerNumber, frames.tick);
    const sorted = [...frames.deltas].sort((a, b) => a - b);
    const percentile = (fraction: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
    const report = {
      source,
      fixtureDigest,
      repetition,
      seed: variant.seed,
      sampleMs: frames.elapsedMs,
      frames: sorted.length,
      frameMs: { p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99) },
      ticks: after.tick - before.tick,
      decisions: after.decisionSequence - before.decisionSequence,
      workers: after.workerCount,
      errors
    };
    const directory = join(root, "tmp/ai-gameplay-reliability/rendered-opening");
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, `${source}-${repetition}.json`), JSON.stringify(report));
    console.log("AI_GAMEPLAY_PROFILE", JSON.stringify(report));
    expect(errors).toEqual([]);
    expect(report.frames).toBeGreaterThan(100);
    expect(report.ticks).toBeGreaterThan(200);
    expect(report.decisions).toBeGreaterThan(0);
  });
}
