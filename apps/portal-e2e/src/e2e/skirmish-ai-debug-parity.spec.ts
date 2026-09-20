import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import { digestRuntimeValue } from "./skirmish-ai-runtime-digest";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";

type DebugMode = "hidden" | "shown" | "historical" | "exported";

const repositoryRoot = resolve(__dirname, "../../../..");
const fixturePath = resolve(repositoryRoot, "tools/ai/fixtures/focused-hidden-state-runtime.json");
const screenshotDirectory = resolve(repositoryRoot, "tmp/ai-debug-parity");

async function exerciseDebug(page: Page, mode: DebugMode, checkpointIndex: number): Promise<void> {
  if (mode === "hidden") {
    if (checkpointIndex === 1) await page.screenshot({ path: resolve(screenshotDirectory, "hidden.png") });
    return;
  }
  if (checkpointIndex === -1) {
    await page.waitForFunction(
      () => {
        const host = (
          window as unknown as {
            __fuzzyWaddleAiRuntimeBrowserTestV1?: {
              game: { scene: { getScenes(active: boolean): { scene: { key: string }; aiControllerDebugPanel?: unknown }[] } };
            };
          }
        ).__fuzzyWaddleAiRuntimeBrowserTestV1;
        return !!host?.game.scene.getScenes(false).find((scene) => scene.scene.key === "HudProbableWaffle")
          ?.aiControllerDebugPanel;
      },
      undefined,
      { timeout: 30_000 }
    );
  }
  await page.evaluate(
    ({ selectedMode, index }) => {
      const host = (
        window as unknown as {
          __fuzzyWaddleAiRuntimeBrowserTestV1?: {
            game: {
              scene: {
                getScenes(active: boolean): {
                  scene: { key: string };
                  children: { list: unknown[] };
                }[];
              };
            };
          };
        }
      ).__fuzzyWaddleAiRuntimeBrowserTestV1;
      const hud = host?.game.scene.getScenes(false).find((scene) => scene.scene.key === "HudProbableWaffle");
      const panel = (hud as { aiControllerDebugPanel?: unknown } | undefined)?.aiControllerDebugPanel as
        | {
            toggleLabels(): void;
            selectPlayer(playerNumber: number): void;
            selectCategory(category: string): void;
            labels: {
              historyOffset: number;
              lastTelemetryAt: number;
              refreshTelemetry(now: number): void;
              telemetryText: { text: string };
            }[];
          }
        | undefined;
      if (!panel) {
        const scenes = host?.game.scene.getScenes(false).map((scene) => ({
          key: scene.scene.key,
          hasPanel: !!(scene as { aiControllerDebugPanel?: unknown }).aiControllerDebugPanel,
          hudChildren: scene.scene.key === "HudProbableWaffle"
            ? scene.children?.list.map((child) => (child as { constructor: { name: string } }).constructor.name)
            : undefined
        }));
        throw new Error(`debug_panel_missing:${JSON.stringify(scenes)}`);
      }
      if (index === -1) {
        panel.toggleLabels();
        panel.selectPlayer(2);
        panel.selectCategory("overview");
      }
      if (selectedMode === "historical" && index === 1) {
        const label = panel.labels[0];
        if (!label) throw new Error("debug_label_missing");
        label.historyOffset = 1;
        label.lastTelemetryAt = 0;
        label.refreshTelemetry(performance.now());
        if (!label.telemetryText.text.includes("Snapshot -1")) throw new Error("historical_snapshot_not_selected");
      }
      if (selectedMode === "shown" && index === 1) {
        const text = panel.labels[0]?.telemetryText.text ?? "";
        for (const field of ["Purpose:", "Force:", "Production:", "Economy:", "Next:", "Blocker:"]) {
          if (!text.includes(field)) throw new Error(`overview_field_missing:${field}`);
        }
        if (/production_sim|claim_conflict/u.test(text)) throw new Error("overview_leaked_raw_reason_code");
      }
      if (selectedMode === "shown" && index === 2) {
        panel.selectCategory("transport");
        panel.selectCategory("overview");
        if (panel.labels.length !== 1) throw new Error("debug_category_switch_leaked_label");
      }
      if (selectedMode === "exported" && index >= 1) {
        const controller = window.__fuzzyWaddleAiRuntimePartsV1?.(2)?.controller;
        if (!controller) throw new Error("debug_controller_missing");
        const history = JSON.parse(controller.exportBrainDebugHistory()) as unknown[];
        if (history.length === 0) throw new Error("debug_export_empty");
      }
    },
    { selectedMode: mode, index: checkpointIndex }
  );
  if (checkpointIndex === 1 && mode !== "exported") {
    await page.screenshot({ path: resolve(screenshotDirectory, `${mode}.png`) });
  }
}

test("AI debug hidden, shown, historical and exported views preserve authoritative outcomes", async ({ browser }) => {
  test.setTimeout(600_000);
  mkdirSync(screenshotDirectory, { recursive: true });
  const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as RuntimeFixtureV1;
  const authoredVariant = fixture.recipe.variants[0];
  if (!authoredVariant) throw new Error("debug_parity_variant_missing");
  const variant = { ...authoredVariant, checkpointTicks: [20, 100, 200, 400] };
  const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const fixtureDigest = digestRuntimeValue(fixture);
  const modes: readonly DebugMode[] = ["hidden", "shown", "historical", "exported"];
  const results = [];
  for (const mode of modes) {
    results.push(
      await runVariant(browser, fixture, variant, null, ["SCOUT-05"], revision, fixtureDigest, (page, index) =>
        exerciseDebug(page, mode, index)
      )
    );
  }
  const authoritativeDigests = results.map((result) =>
    digestRuntimeValue(
      result.checkpoints.map((checkpoint) => ({
        targetTick: checkpoint.targetTick,
        decisionSequence: checkpoint.decisionSequence,
        openingSteps: checkpoint.openingSteps,
        appliedCommands: checkpoint.appliedCommands,
        ownedActorNames: checkpoint.ownedActorNames,
        resourceStockpiles: checkpoint.resourceStockpiles,
        decisionFacts: checkpoint.decisionFacts,
        demands: checkpoint.demands,
        squads: checkpoint.squads,
        gameResult: checkpoint.gameResult
      }))
    )
  );
  expect(results.flatMap((result) => result.aiErrors)).toEqual([]);
  expect(results.at(0)?.checkpoints.at(-1)?.decisionSequence).toBeGreaterThan(0);
  expect(new Set(authoritativeDigests).size).toBe(1);
});
