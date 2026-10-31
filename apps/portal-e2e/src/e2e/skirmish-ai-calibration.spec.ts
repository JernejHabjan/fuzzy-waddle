import { test } from "@playwright/test";
import { readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { AiCalibrationJob } from "./skirmish-ai-calibration-job";
import { prepareRuntimeVariant, configureLobby } from "./skirmish-ai-runtime-variant-setup";
import { runCalibrationArena } from "./skirmish-ai-calibration-arena";

const requestPath = process.env.AI_CALIBRATION_REQUEST;
test.skip(!requestPath, "Only the frozen-source D-06 driver dispatches these workloads.");
test.setTimeout(43_200_000);

test("executes each frozen native legal-start workload without exporting raw capture bodies", async ({ browser }) => {
  if (!requestPath || statSync(requestPath).size > 256 * 1024) throw new Error("calibration_request_missing_or_oversized");
  const request = JSON.parse(readFileSync(requestPath, "utf8")) as { schemaVersion: 1; sourceRevision: string;
    fixtureDigest: string; manifestDigest: string; adapterDigest: string | null; output: string;
    fixture: RuntimeFixtureV1; jobs: AiCalibrationJob[] };
  const url = new URL(process.env.AI_CALIBRATION_BASE_URL ?? "");
  if (request.schemaVersion !== 1 || !/^[a-f0-9]{40}$/.test(request.sourceRevision) || !request.fixtureDigest ||
      !["localhost", "127.0.0.1"].includes(url.hostname) || !request.manifestDigest || request.jobs.length < 1 ||
      request.jobs.length > 200 || new Set(request.jobs.map((job) => job.id)).size !== request.jobs.length)
    throw new Error("calibration_frozen_request_invalid");
  for (const job of request.jobs) {
    if (!/^[a-z0-9-]{1,120}$/.test(job.id) || ![1, 2].includes(job.targetPlayerNumber) ||
        !["candidate", "baseline"].includes(job.revision) || !["Tivara", "Skaduwee"].includes(job.faction) ||
        !["calibration", "holdout", "soak"].includes(job.phase) ||
        (job.revision === "baseline") !== (job.difficulty === "Legacy") ||
        job.revision === "baseline" && request.sourceRevision !== "de47f482889db30420692bf4406fba463d7db296" ||
        !["River Crossing", "Ember Enclave"].includes(job.mapLabel) || !Number.isSafeInteger(job.seed) ||
        !["Easy", "Normal", "Hard", "Legacy"].includes(job.difficulty) ||
        !["balanced", "rush", "macro", "turtle", "tech"].includes(job.opponentArchetype) ||
        job.maximumTick !== (job.phase === "soak" ? 72000 : 18000)) throw new Error("calibration_native_job_invalid");
    const path = join(request.output, `${job.id}.json`);
    if (existsSync(path)) throw new Error("calibration_cannot_reuse_old_match_output");
    const context = await browser.newContext(), page = await context.newPage(), aiErrors: string[] = [];
    page.on("pageerror", (error) => { if (aiErrors.length < 8) aiErrors.push(error.message.slice(0, 240)); });
    page.on("console", (message) => { if (message.type() === "error" && aiErrors.length < 8) aiErrors.push(message.text().slice(0, 240)); });
    const enemy = job.faction === "Tivara" ? "Skaduwee" : "Tivara";
    const variant: RuntimeVariantV1 = { id: job.id, executionKind: "focused_natural", role: "standalone", seed: job.seed,
      aiFaction: job.targetPlayerNumber === 2 ? job.faction : enemy, humanFaction: job.targetPlayerNumber === 1 ? job.faction : enemy,
      difficulty: job.difficulty === "Legacy" ? "Normal" : job.difficulty, mapLabel: job.mapLabel,
      setupRationale: "Both original map slots become native AI controllers before ordinary bootstrap; no preset actors or income." };
    let record: object;
    try {
      if (job.revision === "candidate") await prepareRuntimeVariant(page, request.fixture, variant, job.seed,
        request.sourceRevision, request.fixtureDigest, false, aiErrors, undefined, false,
        { targetPlayerNumber: job.targetPlayerNumber, difficulty: variant.difficulty, opponentArchetype: job.opponentArchetype });
      else {
        if (!request.adapterDigest) throw new Error("calibration_pinned_adapter_identity_missing");
        await page.addInitScript((value) => sessionStorage.setItem("fuzzy-waddle:ai-calibration-legacy-v1", JSON.stringify(value)),
          { enabled: true, seed: job.seed, calibration: { targetPlayerNumber: job.targetPlayerNumber } });
        await configureLobby(page, request.fixture, variant, false);
        await page.waitForFunction(() => {
          const host = (window as unknown as { __nativeCalibrationLegacy?: { game: {
            scene: { getScenes(active: boolean): { scene: { key: string }; getSceneGameData(): {
              initializers: { sceneInitialized: { getValue(): boolean } } } }[] } } } }).__nativeCalibrationLegacy;
          return host?.game.scene.getScenes(true).some((scene) => scene.scene.key.startsWith("Map") &&
            scene.getSceneGameData().initializers.sceneInitialized.getValue());
        });
      }
      const native = await runCalibrationArena(page, job);
      record = { ...native, sourceRevision: request.sourceRevision, fixtureDigest: request.fixtureDigest,
        manifestDigest: request.manifestDigest, adapterDigest: request.adapterDigest,
        failures: [...native.failures, ...(aiErrors.length ? ["native_browser_error"] : [])], aiErrors };
    } catch (error) {
      record = { job, sourceRevision: request.sourceRevision, fixtureDigest: request.fixtureDigest,
        manifestDigest: request.manifestDigest, adapterDigest: request.adapterDigest, status: "capture_failed",
        tick: 0, decisions: 0, result: null, failures: [String(error).slice(0, 400)], aiErrors };
    } finally { await context.close(); }
    let text = JSON.stringify(record);
    if (Buffer.byteLength(text) > 128 * 1024) text = JSON.stringify({ job, sourceRevision: request.sourceRevision,
      fixtureDigest: request.fixtureDigest, manifestDigest: request.manifestDigest, adapterDigest: request.adapterDigest,
      status: "capture_failed", tick: 0, decisions: 0, result: null, failures: ["native_match_capture_byte_limit"] });
    writeFileSync(path, text, { flag: "wx" });
  }
});
