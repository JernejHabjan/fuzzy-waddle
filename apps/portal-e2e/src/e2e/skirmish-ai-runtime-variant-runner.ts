import type { Browser, Page } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import { captureCheckpoint } from "./skirmish-ai-runtime-checkpoint-capture";
import { last } from "./skirmish-ai-runtime-value";
import { applyRuntimePerturbation } from "./skirmish-ai-runtime-perturbation-runner";
import { digestRuntimeValue, projectRuntimeOutcomeDigestInput } from "./skirmish-ai-runtime-digest";
import { prepareRuntimeVariant } from "./skirmish-ai-runtime-variant-setup";

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
  const profiling = process.env.AI_SKIRMISH_PROFILE === "1";
  const variantStartedAt = performance.now();
  const context = await browser.newContext();
  const page = await context.newPage();
  const checkpointPhases: {
    targetTick: number;
    advanceMs: number;
    settleMs: number;
    captureMs: number;
  }[] = [];
  let perturbationMs = 0;
  const aiErrors: string[] = [];
  const effectiveSeed = requestedSeed ?? variant.seed;

  try {
    const initialBoundary = await prepareRuntimeVariant(
      page, fixture, variant, effectiveSeed, sourceRevision, fixtureDigest, profiling, aiErrors, debugProbe
    );
    const setupMs = Math.round(performance.now() - variantStartedAt);
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
        const perturbationStartedAt = performance.now();
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
        if (profiling) perturbationMs += performance.now() - perturbationStartedAt;
      }
      const advanceStartedAt = performance.now();
      await setSimulationState(
        page,
        fixture.recipe.aiPlayerNumber,
        "resume",
        index === 0 ? 1 : fixture.recipe.simulationTimeScale
      );
      await waitForSimulationTick(page, fixture.recipe.aiPlayerNumber, targetTick);
      const settleStartedAt = performance.now();
      await setSimulationState(page, fixture.recipe.aiPlayerNumber, "pause", fixture.recipe.simulationTimeScale);
      await waitForSettledDecision(page, fixture.recipe.aiPlayerNumber);
      const captureStartedAt = performance.now();
      checkpoints.push(await captureCheckpoint(page, fixture.recipe.aiPlayerNumber, targetTick));
      await debugProbe?.(page, index);
      if (profiling) {
        checkpointPhases.push({
          targetTick,
          advanceMs: Math.round(settleStartedAt - advanceStartedAt),
          settleMs: Math.round(captureStartedAt - settleStartedAt),
          captureMs: Math.round(performance.now() - captureStartedAt)
        });
      }
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
        ? {
            fixtureId: initialBoundary.presetApplication.fixtureId,
            sourceRevision: initialBoundary.presetApplication.sourceRevision,
            fixtureDigest: initialBoundary.presetApplication.fixtureDigest,
            createdActorNames: initialBoundary.presetApplication.createdActorNames,
            resourceGrantCount: initialBoundary.presetApplication.resourceGrantCount,
            resourceStartCount: initialBoundary.presetApplication.resourceStartCount,
            queuedItemCount: initialBoundary.presetApplication.queuedItemCount,
            initialOrderCount: initialBoundary.presetApplication.initialOrderCount
          }
        : null
    });
    const outcomeDigest = digestRuntimeValue({
      checkpoints: projectRuntimeOutcomeDigestInput(checkpoints, !variant.presetWorld),
      perturbations,
      aiErrors
    });
    const browserLongTasks = profiling
      ? await page.evaluate(() => {
          const metrics = (
            window as unknown as {
              __skirmishPerf?: { count: number; totalMs: number; maximumMs: number };
            }
          ).__skirmishPerf;
          return metrics
            ? {
                count: metrics.count,
                totalMs: Math.round(metrics.totalMs),
                maximumMs: Math.round(metrics.maximumMs)
              }
            : null;
        })
      : null;
    return {
      variantId: variant.id,
      seed: effectiveSeed,
      aiFaction: variant.aiFaction,
      initialOwnedActorCount: initialBoundary.state.ownedActorCount,
      initialWorkerCount: initialBoundary.state.workerCount,
      presetFixtureId: initialBoundary.presetApplication?.fixtureId ?? null,
      presetCreatedActorNames: initialBoundary.presetApplication?.createdActorNames ?? [],
      presetCreatedActorIds: initialBoundary.presetApplication?.createdActorIds ?? {},
      presetResourceGrantCount: initialBoundary.presetApplication?.resourceGrantCount ?? 0,
      presetResourceStartCount: initialBoundary.presetApplication?.resourceStartCount ?? 0,
      presetInitialResourceBalances: initialBoundary.initialResourceBalances,
      presetQueuedItemCount: initialBoundary.presetApplication?.queuedItemCount ?? 0,
      presetInitialOrderCount: initialBoundary.presetApplication?.initialOrderCount ?? 0,
      determinismGroup: variant.determinismGroup ?? null,
      ...(variant.supplyBranch ? { supplyBranch: variant.supplyBranch } : {}),
      ...(variant.pressureBranch ? { pressureBranch: variant.pressureBranch } : {}),
      ...(variant.resourceServiceBranch ? { resourceServiceBranch: variant.resourceServiceBranch } : {}),
      initialWorldDigest,
      outcomeDigest,
      checkpoints,
      perturbations,
      aiErrors,
      ...(profiling
        ? {
            timing: {
              setupMs,
              perturbationMs: Math.round(perturbationMs),
              totalWallMsExcludingTeardown: Math.round(performance.now() - variantStartedAt),
              checkpointPhases,
              browserLongTasks
            }
          }
        : {})
    };
  } finally {
    await context.close();
  }
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
