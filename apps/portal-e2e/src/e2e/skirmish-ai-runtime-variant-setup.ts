import type { Page } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import { installRuntimeAccessor } from "./skirmish-ai-runtime-browser-accessor";

/** Installs bounded browser probes, launches the ordinary lobby, and verifies authored pre-tick state. */
export async function prepareRuntimeVariant(
  page: Page,
  fixture: RuntimeFixtureV1,
  variant: RuntimeVariantV1,
  effectiveSeed: number,
  sourceRevision: string,
  fixtureDigest: string,
  profiling: boolean,
  aiErrors: string[],
  debugProbe?: (page: Page, checkpointIndex: number) => Promise<void>
) {
  if (profiling) {
    await page.addInitScript(() => {
      const metrics = { count: 0, totalMs: 0, maximumMs: 0 };
      (window as unknown as { __skirmishPerf?: typeof metrics }).__skirmishPerf = metrics;
      if (typeof PerformanceObserver === "undefined" || !PerformanceObserver.supportedEntryTypes.includes("longtask")) {
        return;
      }
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.count += 1;
          metrics.totalMs += entry.duration;
          metrics.maximumMs = Math.max(metrics.maximumMs, entry.duration);
        }
      }).observe({ entryTypes: ["longtask"] });
    });
  }
  page.on("console", (message) => {
    const text = message.text();
    if (/Error (stepping behaviour tree|updating AI on simulation tick|scheduling next AI step)/i.test(text)) {
      aiErrors.push(text);
    }
  });
  page.on("pageerror", (error) => {
    if (/\bAI\b|player-ai|brain/i.test(error.message)) aiErrors.push(error.message);
  });
  await page.addInitScript(
    ({ seed, presetWorld, revision, digest }) => {
      window.sessionStorage.setItem(
        "fuzzy-waddle:ai-runtime-browser-test-v1",
        JSON.stringify({
          schemaVersion: 1,
          enabled: true,
          seed,
          startPaused: true,
          ...(presetWorld
            ? { presetWorld: { ...presetWorld, provenance: { sourceRevision: revision, fixtureDigest: digest } } }
            : {})
        })
      );
    },
    { seed: effectiveSeed, presetWorld: variant.presetWorld, revision: sourceRevision, digest: fixtureDigest }
  );
  await configureLobby(page, fixture, variant);
  await installRuntimeAccessor(page);
  await page.waitForFunction(
    (playerNumber) => !!window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber),
    fixture.recipe.aiPlayerNumber,
    { timeout: 120_000 }
  );
  await debugProbe?.(page, -1);
  if (variant.presetWorld?.queues?.length) {
    const expected = variant.presetWorld.queues.reduce((count, queue) => count + queue.count, 0);
    await page.waitForFunction(
      (count) => {
        const host = (
          window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: { presetApplication?: { queuedItemCount: number } } }
        ).__fuzzyWaddleAiRuntimeBrowserTestV1;
        return host?.presetApplication?.queuedItemCount === count;
      },
      expected,
      { timeout: 30_000 }
    );
  }
  const initialBoundary = await page.evaluate((playerNumber) => {
    const host = (
      window as unknown as {
        __fuzzyWaddleAiRuntimeBrowserTestV1?: {
          game: {
            scene: {
              getScenes(active: boolean): {
                scene: { key: string };
                players?: { playerNumber: number; getResources(): Record<string, number> }[];
              }[];
            };
          };
          initialStateByPlayer: Record<
            number,
            { ownedActorCount: number; workerCount: number; ownedActorNames: string[] }
          >;
          presetApplication?: {
            fixtureId: string;
            sourceRevision: string;
            fixtureDigest: string;
            createdActorNames: string[];
            createdActorIds: Record<string, string>;
            resourceGrantCount: number;
            resourceStartCount: number;
            queuedItemCount: number;
            initialQueueItems: {
              producerFixtureActorId: string;
              producerActorId: string;
              itemId: string;
              kind: "production" | "research";
              objectName: string | null;
              researchType: string | null;
            }[];
            initialOrderCount: number;
            eventResults: { id: string; tick: number; affectedActors: number; subjectName: string }[];
          };
        };
      }
    ).__fuzzyWaddleAiRuntimeBrowserTestV1;
    const state = host?.initialStateByPlayer[playerNumber];
    if (!state) throw new Error("runtime_initial_state_unavailable");
    const scene = host?.game.scene.getScenes(true).find((candidate) => candidate.scene.key.startsWith("Map"));
    const initialResourceBalances = Object.fromEntries(
      (scene?.players ?? []).map((player) => [player.playerNumber, player.getResources()])
    );
    return { state, presetApplication: host?.presetApplication ?? null, initialResourceBalances };
  }, fixture.recipe.aiPlayerNumber);
  if (variant.presetWorld) {
    const application = initialBoundary.presetApplication;
    if (!application) throw new Error("runtime_preset_application_missing");
    if (application.fixtureId !== variant.presetWorld.fixtureId) throw new Error("runtime_preset_fixture_mismatch");
    if (application.sourceRevision !== sourceRevision) throw new Error("runtime_preset_source_mismatch");
    if (application.fixtureDigest !== fixtureDigest) throw new Error("runtime_preset_digest_mismatch");
    if (application.resourceStartCount !== (variant.presetWorld.resourceStarts?.length ?? 0)) {
      throw new Error("runtime_preset_resource_start_mismatch");
    }
    for (const start of variant.presetWorld.resourceStarts ?? []) {
      for (const [resourceType, target] of Object.entries(start.amounts)) {
        if (initialBoundary.initialResourceBalances[start.playerNumber]?.[resourceType] !== target) {
          throw new Error(`runtime_preset_resource_start_not_observed:${start.playerNumber}:${resourceType}`);
        }
      }
    }
    const requestedQueues = variant.presetWorld.queues?.reduce((count, queue) => count + queue.count, 0) ?? 0;
    if (application.queuedItemCount !== requestedQueues) throw new Error("runtime_preset_queue_mismatch");
    const expectedQueueItems = (variant.presetWorld.queues ?? []).flatMap((queue) =>
      Array.from({ length: queue.count }, () => ({ producerFixtureActorId: queue.producerFixtureActorId,
        objectName: queue.actorName })));
    const observedQueueItems = application.initialQueueItems.map((item) => ({
      producerFixtureActorId: item.producerFixtureActorId,
      objectName: item.objectName
    }));
    if (JSON.stringify([...expectedQueueItems].sort(compareQueueItem)) !==
        JSON.stringify([...observedQueueItems].sort(compareQueueItem)) ||
        new Set(application.initialQueueItems.map((item) => item.itemId)).size !== requestedQueues) {
      throw new Error("runtime_preset_queue_identity_mismatch");
    }
    if (application.initialOrderCount !== (variant.presetWorld.initialOrders?.length ?? 0)) {
      throw new Error("runtime_preset_initial_order_mismatch");
    }
  } else if (initialBoundary.presetApplication) {
    throw new Error("runtime_unrequested_preset_application");
  }
  return initialBoundary;
}

function compareQueueItem(left: { producerFixtureActorId: string; objectName: string },
  right: { producerFixtureActorId: string; objectName: string }): number {
  return left.producerFixtureActorId.localeCompare(right.producerFixtureActorId) ||
    left.objectName.localeCompare(right.objectName);
}

async function configureLobby(page: Page, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1): Promise<void> {
  await page.goto("/aota/skirmish");
  await page.getByText(variant.mapLabel ?? fixture.recipe.mapLabel, { exact: true }).click();
  const dismissHint = page.getByRole("button", { name: "Got it" });
  if (await dismissHint.isVisible()) await dismissHint.click();
  await page.locator("#faction-1").selectOption({ label: variant.humanFaction });
  await page.locator(`#faction-${fixture.recipe.aiPlayerNumber}`).selectOption({ label: variant.aiFaction });
  await page.locator(`#difficulty-${fixture.recipe.aiPlayerNumber}`).selectOption({ label: variant.difficulty });
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "Start Game" }).click();
  await page.waitForURL(/\/aota\/game$/);
}
