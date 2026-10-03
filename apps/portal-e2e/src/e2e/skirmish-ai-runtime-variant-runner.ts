import type { Browser, Page } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import { captureCheckpoint } from "./skirmish-ai-runtime-checkpoint-capture";
import { last } from "./skirmish-ai-runtime-value";
import { applyRuntimePerturbation } from "./skirmish-ai-runtime-perturbation-runner";
import { digestRuntimeValue, projectRuntimeOutcomeDigestInput, projectRuntimePresetQueueDigest } from "./skirmish-ai-runtime-digest";
import { prepareRuntimeVariant } from "./skirmish-ai-runtime-variant-setup";
import { canStopAfterTerminal } from "./skirmish-ai-runtime-terminal";
import { evaluateEvidenceStopAtCheckpoint } from "./skirmish-ai-runtime-evidence-stop-evaluation";
import { collectRuntimePresetEvents } from "./skirmish-ai-runtime-preset-event-results";
import { captureRuntimeProductionAuthority } from "./skirmish-ai-runtime-production-capture";

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
    const applicableScenarioIds = requestedScenarioIds.filter(
      (scenarioId) => variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId)
    );
    const captureProduction = applicableScenarioIds.some((id) => ["PRO-03", "PRO-06", "PRO-07"].includes(id));
    let productionCapture = captureProduction
      ? await captureRuntimeProductionAuthority(page, fixture.recipe.aiPlayerNumber) : undefined;
    let stopReason: RuntimeVariantResultV1["stopReason"] = "checkpoint_ceiling";
    let satisfiedSinceTick: number | null = null;
    const maximumTick = Math.max(
      ...applicableScenarioIds
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
      const checkpoint = await captureCheckpoint(page, fixture.recipe.aiPlayerNumber, targetTick);
      checkpoints.push(checkpoint);
      if (captureProduction) productionCapture = await captureRuntimeProductionAuthority(page, fixture.recipe.aiPlayerNumber);
      await debugProbe?.(page, index);
      if (profiling) {
        checkpointPhases.push({
          targetTick,
          advanceMs: Math.round(settleStartedAt - advanceStartedAt),
          settleMs: Math.round(captureStartedAt - settleStartedAt),
          captureMs: Math.round(performance.now() - captureStartedAt)
        });
      }
      const pendingEventTicks = [
        ...pendingPerturbations.map((event) => event.tick),
        ...(variant.presetWorld?.events ?? []).map((event) => event.tick)
      ];
      if (canStopAfterTerminal(fixture.assertions, applicableScenarioIds, checkpoint, pendingEventTicks)) {
        stopReason = "terminal_result";
        break;
      }
      if (variant.evidenceStop) {
        const next = evaluateEvidenceStopAtCheckpoint({
          variant, fixture, scenarioIds: applicableScenarioIds, initialBoundary, effectiveSeed,
          checkpoints, perturbations, aiErrors, pendingEventTicks, satisfiedSinceTick
        });
        satisfiedSinceTick = next.satisfiedSinceTick;
        if (next.stop) {
          stopReason = "evidence_satisfied";
          break;
        }
      }
    }
    perturbations.push(...await collectRuntimePresetEvents(page, variant));

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
            initialQueueItems: projectRuntimePresetQueueDigest(initialBoundary.presetApplication.initialQueueItems),
            initialOrderCount: initialBoundary.presetApplication.initialOrderCount
          }
        : null
    });
    const outcomeDigest = digestRuntimeValue({
      checkpoints: projectRuntimeOutcomeDigestInput(checkpoints, !variant.presetWorld, !!variant.productionCompositionBranch),
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
      mapLabel: variant.mapLabel ?? fixture.recipe.mapLabel,
      stopReason,
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
      presetInitialQueueItems: initialBoundary.presetApplication?.initialQueueItems ?? [],
      presetQueueApplications: initialBoundary.presetApplication?.queueApplications ?? [],
      presetInitialOrderCount: initialBoundary.presetApplication?.initialOrderCount ?? 0,
      determinismGroup: variant.determinismGroup ?? null,
      ...(variant.supplyBranch ? { supplyBranch: variant.supplyBranch } : {}),
      ...(variant.pressureBranch ? { pressureBranch: variant.pressureBranch } : {}),
      ...(variant.resourceServiceBranch ? { resourceServiceBranch: variant.resourceServiceBranch } : {}),
      ...(variant.productionCapacityBranch ? { productionCapacityBranch: variant.productionCapacityBranch } : {}),
      ...(variant.productionCompositionBranch ? { productionCompositionBranch: variant.productionCompositionBranch } : {}),
      initialWorldDigest,
      outcomeDigest,
      ...(productionCapture ? { productionCapture } : {}),
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
