import type { Browser, Page } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import { installRuntimeAccessor } from "./skirmish-ai-runtime-browser-accessor";
import { captureCheckpoint } from "./skirmish-ai-runtime-checkpoint-capture";
import { last } from "./skirmish-ai-runtime-value";
import { applyRuntimePerturbation } from "./skirmish-ai-runtime-perturbation-runner";
import { digestRuntimeValue, projectRuntimeOutcomeDigestInput } from "./skirmish-ai-runtime-digest";

export async function runVariant(
  browser: Browser,
  fixture: RuntimeFixtureV1,
  variant: RuntimeVariantV1,
  requestedSeed: number | null,
  requestedScenarioIds: readonly string[],
  sourceRevision: string,
  fixtureDigest: string,
  debugProbe?: (page: Page, checkpointIndex: number) => Promise<void>
): Promise<RuntimeVariantResultV1> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const aiErrors: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (/Error (stepping behaviour tree|updating AI on simulation tick|scheduling next AI step)/i.test(text)) {
      aiErrors.push(text);
    }
  });
  page.on("pageerror", (error) => {
    if (/\bAI\b|player-ai|brain/i.test(error.message)) aiErrors.push(error.message);
  });
  const effectiveSeed = requestedSeed ?? variant.seed;
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

  try {
    await configureLobby(page, fixture, variant);
    await installRuntimeAccessor(page);
    await waitForRuntimeController(page, fixture.recipe.aiPlayerNumber);
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
            initialStateByPlayer: Record<
              number,
              { ownedActorCount: number; workerCount: number; ownedActorNames: string[] }
            >;
            presetApplication?: {
              fixtureId: string;
              sourceRevision: string;
              fixtureDigest: string;
              createdActorNames: string[];
              resourceGrantCount: number;
              queuedItemCount: number;
              eventResults: { id: string; tick: number; affectedActors: number; subjectName: string }[];
            };
          };
        }
      ).__fuzzyWaddleAiRuntimeBrowserTestV1;
      const state = host?.initialStateByPlayer[playerNumber];
      if (!state) throw new Error("runtime_initial_state_unavailable");
      return { state, presetApplication: host?.presetApplication ?? null };
    }, fixture.recipe.aiPlayerNumber);
    if (variant.presetWorld) {
      const application = initialBoundary.presetApplication;
      if (!application) throw new Error("runtime_preset_application_missing");
      if (application.fixtureId !== variant.presetWorld.fixtureId) throw new Error("runtime_preset_fixture_mismatch");
      if (application.sourceRevision !== sourceRevision) throw new Error("runtime_preset_source_mismatch");
      if (application.fixtureDigest !== fixtureDigest) throw new Error("runtime_preset_digest_mismatch");
      const requestedQueues = variant.presetWorld.queues?.reduce((count, queue) => count + queue.count, 0) ?? 0;
      if (application.queuedItemCount !== requestedQueues) throw new Error("runtime_preset_queue_mismatch");
    } else if (initialBoundary.presetApplication) {
      throw new Error("runtime_unrequested_preset_application");
    }
    const checkpoints: RuntimeCheckpointV1[] = [];
    const perturbations: { id: string; tick: number; dispatchedActors: number; subjectName: string | null }[] = [];
    const pendingPerturbations = [...(variant.perturbations ?? [])].sort(
      (left, right) => left.tick - right.tick || left.id.localeCompare(right.id)
    );
    const maximumTick = Math.max(
      ...requestedScenarioIds
        .filter((scenarioId) => variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
        .map((scenarioId) => fixture.assertions[scenarioId]?.maximumTick ?? last(fixture.recipe.checkpointTicks))
    );
    const checkpointTicks = [...new Set(variant.checkpointTicks ?? fixture.recipe.checkpointTicks)]
      .filter((tick) => tick <= maximumTick)
      .sort((left, right) => left - right);
    if (checkpointTicks.length === 0) throw new Error("runtime_variant_has_no_checkpoints");
    for (const [index, targetTick] of checkpointTicks.entries()) {
      while (pendingPerturbations[0] && pendingPerturbations[0].tick <= targetTick) {
        const perturbation = pendingPerturbations.shift();
        if (!perturbation) break;
        await setSimulationState(
          page,
          fixture.recipe.aiPlayerNumber,
          "resume",
          index === 0 ? 1 : fixture.recipe.simulationTimeScale
        );
        await waitForSimulationTick(page, fixture.recipe.aiPlayerNumber, perturbation.tick);
        await setSimulationState(page, fixture.recipe.aiPlayerNumber, "pause", fixture.recipe.simulationTimeScale);
        await waitForSettledDecision(page, fixture.recipe.aiPlayerNumber);
        perturbations.push(await applyRuntimePerturbation(page, perturbation, fixture.recipe.aiPlayerNumber));
      }
      await setSimulationState(
        page,
        fixture.recipe.aiPlayerNumber,
        "resume",
        index === 0 ? 1 : fixture.recipe.simulationTimeScale
      );
      await waitForSimulationTick(page, fixture.recipe.aiPlayerNumber, targetTick);
      await setSimulationState(page, fixture.recipe.aiPlayerNumber, "pause", fixture.recipe.simulationTimeScale);
      await waitForSettledDecision(page, fixture.recipe.aiPlayerNumber);
      checkpoints.push(await captureCheckpoint(page, fixture.recipe.aiPlayerNumber, targetTick));
      await debugProbe?.(page, index);
    }
    if (variant.presetWorld?.events?.length) {
      const eventResults = await page.evaluate(() => {
        const host = (
          window as unknown as {
            __fuzzyWaddleAiRuntimeBrowserTestV1?: {
              presetApplication?: {
                eventResults: { id: string; tick: number; affectedActors: number; subjectName: string }[];
              };
            };
          }
        ).__fuzzyWaddleAiRuntimeBrowserTestV1;
        return host?.presetApplication?.eventResults ?? [];
      });
      if (eventResults.length !== variant.presetWorld.events.length) {
        throw new Error("runtime_preset_events_incomplete");
      }
      perturbations.push(
        ...eventResults.map((event) => ({
          id: event.id,
          tick: event.tick,
          dispatchedActors: event.affectedActors,
          subjectName: event.subjectName
        }))
      );
    }

    const initialWorldDigest = digestRuntimeValue({
      seed: effectiveSeed,
      actors: initialBoundary.state.ownedActorNames,
      authoredPreset: variant.presetWorld ?? null,
      preset: initialBoundary.presetApplication
    });
    const outcomeDigest = digestRuntimeValue({
      checkpoints: projectRuntimeOutcomeDigestInput(checkpoints, !variant.presetWorld),
      perturbations,
      aiErrors
    });
    return {
      variantId: variant.id,
      seed: effectiveSeed,
      aiFaction: variant.aiFaction,
      initialOwnedActorCount: initialBoundary.state.ownedActorCount,
      initialWorkerCount: initialBoundary.state.workerCount,
      presetFixtureId: initialBoundary.presetApplication?.fixtureId ?? null,
      presetCreatedActorNames: initialBoundary.presetApplication?.createdActorNames ?? [],
      presetResourceGrantCount: initialBoundary.presetApplication?.resourceGrantCount ?? 0,
      presetQueuedItemCount: initialBoundary.presetApplication?.queuedItemCount ?? 0,
      determinismGroup: variant.determinismGroup ?? null,
      ...(variant.supplyBranch ? { supplyBranch: variant.supplyBranch } : {}),
      initialWorldDigest,
      outcomeDigest,
      checkpoints,
      perturbations,
      aiErrors
    };
  } finally {
    await context.close();
  }
}

async function configureLobby(
  page: Page,
  fixture: RuntimeFixtureV1,
  variant: RuntimeVariantV1
): Promise<void> {
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

async function waitForRuntimeController(page: Page, aiPlayerNumber: number): Promise<void> {
  await page.waitForFunction((playerNumber) => !!window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber), aiPlayerNumber, {
    timeout: 120_000
  });
}

async function waitForSimulationTick(page: Page, aiPlayerNumber: number, targetTick: number): Promise<void> {
  await page.waitForFunction(
    ({ playerNumber, tick }) =>
      (window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber)?.tickService.currentTick ?? -1) >= tick,
    { playerNumber: aiPlayerNumber, tick: targetTick },
    { timeout: 120_000 }
  );
}

async function waitForSettledDecision(page: Page, aiPlayerNumber: number): Promise<void> {
  await page.waitForFunction(
    (playerNumber) =>
      window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber)?.controller.isDecisionBoundarySettled() === true,
    aiPlayerNumber,
    { timeout: 30_000 }
  );
}

async function setSimulationState(
  page: Page,
  aiPlayerNumber: number,
  state: "pause" | "resume",
  scale: number
): Promise<void> {
  await page.evaluate(
    ({ playerNumber, nextState, timeScale }) => {
      const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber);
      if (!parts) throw new Error("runtime_controller_unavailable");
      parts.tickService.setSimulationTimeScale(timeScale);
      if (nextState === "pause") parts.tickService.pauseTick("manual");
      else parts.tickService.resumeTick("manual");
    },
    { playerNumber: aiPlayerNumber, nextState: state, timeScale: scale }
  );
}
