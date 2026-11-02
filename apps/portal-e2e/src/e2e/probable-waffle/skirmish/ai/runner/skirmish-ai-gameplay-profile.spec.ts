import { digestCanonicalAiValue } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/persistence/canonical-ai-serialization";
import { validAiRuntimePresetProvenance } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/presets/validation/validate-ai-runtime-preset-provenance";
import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prepareRuntimeVariant } from "../setup/skirmish-ai-runtime-variant-setup";
import { captureCheckpoint } from "../capture/skirmish-ai-runtime-checkpoint-capture";
import type { RuntimeFixture } from "../contracts/skirmish-ai-runtime-fixture";
import { SkirmishGameplayCpuProfile } from "./profiling/skirmish-ai-gameplay-cpu-profile";

test.skip(process.env.AI_GAMEPLAY_PROFILE !== "1", "Explicit real-time gameplay profiling only");
test.setTimeout(180_000);
const workload = process.env.AI_GAMEPLAY_PROFILE_WORKLOAD ?? "opening";
if (!["opening", "combat", "multi_ai"].includes(workload)) throw new Error("profile_workload_invalid");
const sampleCpu = process.env.AI_GAMEPLAY_PROFILE_CPU === "1";

for (let repetition = 1; repetition <= 3; repetition++) {
  test(`records rendered 1x AI ${workload} sample ${repetition}`, async ({ page }) => {
    const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
    const source = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const dirtySourceDigest = createHash("sha256")
      .update(execFileSync("git", ["diff", "HEAD", "--", "libs", "apps"]))
      .digest("hex");
    const fixturePath =
      workload !== "combat"
        ? "economy/opening-workforce-native-gameplay.json"
        : "combat/fight-01-reassess-and-retreat-regroup-within-bound-runtime.json";
    const fixture: RuntimeFixture = JSON.parse(
      readFileSync(join(root, "tools/probable-waffle/skirmish/ai/testing/fixtures/native", fixturePath), "utf8")
    );
    const selected = fixture.recipe.variants.find(
      (candidate) => candidate.id === (workload !== "combat" ? "tivara-no-worker-opening" : "fight-01-tivara-quiet")
    );
    if (!selected) throw new Error("profile_workload_missing");
    // Broad authority capture is a separate evidence workload; it must not dominate rendered gameplay profiling.
    const variant = { ...selected, captureConstruction: undefined, captureCombat: undefined };
    const errors: string[] = [];
    const fixtureDigest = digestCanonicalAiValue(fixture);
    if (!validAiRuntimePresetProvenance({ sourceRevision: source, fixtureDigest }))
      throw new Error("profile_preset_provenance_invalid");
    const configurationDigest = createHash("sha256")
      .update(
        JSON.stringify({
          variant,
          workload,
          sampleCpu,
          targetTicks: 240,
          warmupTicks: 40
        })
      )
      .digest("hex");
    const directory = join(root, `tmp/ai-gameplay-reliability/rendered-${workload}`);
    mkdirSync(directory, { recursive: true });
    const artifactName = `${source}-${configurationDigest.slice(0, 12)}-${repetition}`;
    await prepareRuntimeVariant(
      page,
      fixture,
      variant,
      variant.seed,
      source,
      fixtureDigest,
      true,
      errors,
      undefined,
      false,
      workload === "multi_ai"
        ? { targetPlayerNumber: 1, difficulty: "Normal", opponentArchetype: "balanced" }
        : undefined
    );
    const before = await page.evaluate((playerNumber) => {
      const parts = window.__fuzzyWaddleAiRuntimeParts?.(playerNumber);
      if (!parts) throw new Error("profile_runtime_missing");
      return {
        tick: parts.tickService.currentTick,
        decisionSequence: parts.controller.getBrainState()?.scheduler.decisionSequence ?? 0
      };
    }, fixture.recipe.aiPlayerNumber);
    const cpu = sampleCpu ? await SkirmishGameplayCpuProfile.start(page) : undefined;
    const cpuResult: { value?: Awaited<ReturnType<SkirmishGameplayCpuProfile["finish"]>> } = {};
    const frames = await (async () => {
      try {
        return await page.evaluate(async (playerNumber) => {
          const parts = window.__fuzzyWaddleAiRuntimeParts?.(playerNumber);
          const host = window as unknown as {
            __fuzzyWaddleAiRuntimeBrowserTest?: {
              game: {
                loop: { wake(): void; sleep(): void; targetFps: number; actualFps: number; delta: number };
                renderer?: { type: number };
              };
            };
          };
          const game = host.__fuzzyWaddleAiRuntimeBrowserTest?.game;
          if (!parts || !game) throw new Error("profile_runtime_missing");
          const deltas: number[] = [],
            engineDeltas: number[] = [];
          const firstTick = parts.tickService.currentTick,
            started = performance.now();
          let previous = started,
            frame = 0;
          parts.tickService.setSimulationTimeScale(1);
          parts.tickService.resumeTick("manual");
          game.loop.wake();
          try {
            await new Promise<void>((resolve) => {
              const sample = (now: number) => {
                const tick = parts.tickService.currentTick;
                if (tick - firstTick >= 40 && deltas.length < 6000) {
                  deltas.push(now - previous);
                  engineDeltas.push(game.loop.delta);
                }
                previous = now;
                if (tick - firstTick >= 240 || now - started >= 60_000) resolve();
                else frame = requestAnimationFrame(sample);
              };
              frame = requestAnimationFrame(sample);
            });
          } finally {
            cancelAnimationFrame(frame);
            game.loop.sleep();
            parts.tickService.pauseTick("manual");
          }
          return {
            deltas,
            engineDeltas,
            elapsedMs: performance.now() - started,
            tick: parts.tickService.currentTick,
            rendererType: game.renderer?.type,
            targetFps: game.loop.targetFps,
            actualFps: game.loop.actualFps,
            pauseReasons: (
              parts.tickService as typeof parts.tickService & { getPauseReasons(): readonly string[] }
            ).getPauseReasons()
          };
        }, fixture.recipe.aiPlayerNumber);
      } finally {
        if (cpu) cpuResult.value = await cpu.finish(join(directory, `${artifactName}.cpuprofile`));
      }
    })();
    const after = await captureCheckpoint(page, fixture.recipe.aiPlayerNumber, frames.tick);
    const sorted = [...frames.deltas].sort((a, b) => a - b);
    const percentile = (fraction: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
    const report = {
      source,
      dirtySourceDigest,
      fixtureDigest,
      configurationDigest,
      workload,
      repetition,
      seed: variant.seed,
      targetTicks: 240,
      warmupTicks: 40,
      sampleMs: frames.elapsedMs,
      frames: sorted.length,
      frameMs: { p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99) },
      engineDeltaMs:
        frames.engineDeltas.reduce((sum, delta) => sum + delta, 0) / Math.max(1, frames.engineDeltas.length),
      rendererType: frames.rendererType,
      targetFps: frames.targetFps,
      actualFps: frames.actualFps,
      pauseReasons: frames.pauseReasons,
      ticks: after.tick - before.tick,
      decisions: after.decisionSequence - before.decisionSequence,
      workers: after.workerCount,
      army: after.militaryActorNames.length,
      cpu: cpuResult.value,
      errors
    };
    writeFileSync(join(directory, `${artifactName}.json`), JSON.stringify(report));
    console.log(
      "AI_GAMEPLAY_PROFILE",
      JSON.stringify({ ...report, cpu: report.cpu ? { samples: report.cpu.samples } : undefined })
    );
    expect(errors).toEqual([]);
    expect(report.frames).toBeGreaterThan(100);
    expect(report.ticks).toBeGreaterThanOrEqual(240);
    expect(report.decisions).toBeGreaterThan(0);
  });
}
