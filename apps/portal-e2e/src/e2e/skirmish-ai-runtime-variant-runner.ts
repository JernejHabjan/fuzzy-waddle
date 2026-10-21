import type { Browser, Page } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import { captureCheckpoint } from "./skirmish-ai-runtime-checkpoint-capture";
import { last } from "./skirmish-ai-runtime-value";
import { applyRuntimePerturbation } from "./skirmish-ai-runtime-perturbation-runner";
import { digestRuntimeValue, projectRuntimeOutcomeDigestInput } from "./skirmish-ai-runtime-digest";
import { projectRuntimeVariantStart } from "./skirmish-ai-runtime-variant-start-report";
import { prepareRuntimeVariant } from "./skirmish-ai-runtime-variant-setup";
import { canStopAfterTerminal } from "./skirmish-ai-runtime-terminal";
import { evaluateEvidenceStopAtCheckpoint } from "./skirmish-ai-runtime-evidence-stop-evaluation";
import { collectRuntimePresetEvents } from "./skirmish-ai-runtime-preset-event-results";
import { captureRuntimeProductionAuthority } from "./skirmish-ai-runtime-production-capture";
import { buildRuntimeProductionReport, compactRuntimeProductionReport } from "./skirmish-ai-runtime-production-report";
import { advanceRuntimeFrames } from "./skirmish-ai-runtime-frame-driver";

export async function runVariant(
  browser: Browser,
  fixture: RuntimeFixtureV1,
  variant: RuntimeVariantV1,
  requestedSeed: number | null,
  requestedScenarioIds: readonly string[],
  sourceRevision: string,
  fixtureDigest: string,
  debugProbe?: (page: Page, checkpointIndex: number, checkpoint?: RuntimeCheckpointV1) => Promise<void>,
  afterVariant?: (page: Page, result: RuntimeVariantResultV1) => Promise<void>,
  beforeVariant?: (page: Page) => Promise<void>
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
    await beforeVariant?.(page);
    const initialBoundary = await prepareRuntimeVariant(
      page,
      fixture,
      variant,
      effectiveSeed,
      sourceRevision,
      fixtureDigest,
      profiling,
      aiErrors,
      debugProbe
    );
    const setupMs = Math.round(performance.now() - variantStartedAt);
    const checkpoints: RuntimeCheckpointV1[] = [];
    const perturbations: { id: string; tick: number; dispatchedActors: number; subjectName: string | null }[] = [];
    const pendingPerturbations = [...(variant.perturbations ?? [])].sort(
      (left, right) => left.tick - right.tick || left.id.localeCompare(right.id)
    );
    const applicableScenarioIds = requestedScenarioIds.filter(
      (scenarioId) =>
        fixture.scenarioIds.includes(scenarioId) &&
        (variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
    );
    const fullProductionProof = applicableScenarioIds.some(
      (id) => ["PRO-03", "PRO-06", "PRO-07", "H-17", "H-18"].includes(id) || id.startsWith("TECH-")
    );
    const captureProduction =
      fullProductionProof || variant.captureConstruction === true ||
      applicableScenarioIds.some((id) => ["ECO-05", "ECO-06", "H-16"].includes(id));
    const productionHorizons = applicableScenarioIds.flatMap((id) => {
      const contract =
        fixture.assertions[id]?.requiredProductionContracts?.[variant.id] ??
        fixture.assertions[id]?.requiredTechnologyContracts?.[variant.id] ??
        fixture.assertions[id]?.requiredSupplyRecovery;
      return contract ? [contract.latestTick] : [];
    });
    const productionHorizon = productionHorizons.length ? Math.max(...productionHorizons) :
      variant.captureConstruction === true ? (variant.checkpointTicks ?? fixture.recipe.checkpointTicks).at(-1) : undefined;
    let productionCapture = captureProduction
      ? await captureRuntimeProductionAuthority(page, fixture.recipe.aiPlayerNumber, productionHorizon)
      : undefined;
    const closedProductionHorizon = productionCapture?.frontiers?.latestTick ?? productionHorizon;
    let stopReason: RuntimeVariantResultV1["stopReason"] = "checkpoint_ceiling";
    let satisfiedSinceTick: number | null = null;
    const maximumTick = Math.max(
      ...applicableScenarioIds.map(
        (scenarioId) => fixture.assertions[scenarioId]?.maximumTick ?? last(fixture.recipe.checkpointTicks)
      )
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
        await advanceRuntimeToTick(page, fixture, perturbation.tick, index);
        await setSimulationState(page, fixture.recipe.aiPlayerNumber, "pause", fixture.recipe.simulationTimeScale);
        await waitForSettledDecision(page, fixture.recipe.aiPlayerNumber);
        perturbations.push(await applyRuntimePerturbation(page, perturbation, fixture.recipe.aiPlayerNumber));
        if (profiling) perturbationMs += performance.now() - perturbationStartedAt;
      }
      const advanceStartedAt = performance.now();
      const stopAtTick =
        closedProductionHorizon !== undefined && targetTick >= closedProductionHorizon
          ? closedProductionHorizon + 1
          : targetTick;
      await advanceRuntimeToTick(page, fixture, stopAtTick, index);
      const settleStartedAt = performance.now();
      await setSimulationState(page, fixture.recipe.aiPlayerNumber, "pause", fixture.recipe.simulationTimeScale);
      await waitForSettledDecision(page, fixture.recipe.aiPlayerNumber);
      const captureStartedAt = performance.now();
      const checkpoint = await captureCheckpoint(
        page,
        fixture.recipe.aiPlayerNumber,
        targetTick,
        applicableScenarioIds.some((id) => fixture.assertions[id]?.requireHiddenStateParity)
      );
      checkpoints.push(checkpoint);
      // A terminal score does not seal its own native tick. Close that tick before reading early-terminal proof.
      if (captureProduction && checkpoint.gameResult === "win" &&
          applicableScenarioIds.some((id) => fixture.assertions[id]?.requireAiVictory) &&
          (productionCapture?.frontiers?.closedThroughTick ?? -1) < checkpoint.tick)
        await advanceRuntimeToTick(page, fixture, checkpoint.tick + 1, index);
      if (captureProduction)
        productionCapture = await captureRuntimeProductionAuthority(page, fixture.recipe.aiPlayerNumber);
      await debugProbe?.(page, index, checkpoint);
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
          variant,
          fixture,
          scenarioIds: applicableScenarioIds,
          initialBoundary,
          effectiveSeed,
          checkpoints,
          perturbations,
          aiErrors,
          pendingEventTicks,
          satisfiedSinceTick
        });
        satisfiedSinceTick = next.satisfiedSinceTick;
        if (next.stop) {
          stopReason = "evidence_satisfied";
          break;
        }
      }
    }
    perturbations.push(...(await collectRuntimePresetEvents(page, variant)));

    const outcomeDigest = digestRuntimeValue({
      checkpoints: projectRuntimeOutcomeDigestInput(
        checkpoints,
        !variant.presetWorld,
        !!variant.productionCompositionBranch
      ),
      perturbations,
      aiErrors
    });
    const browserLongTasks = await readRuntimeLongTasks(page, profiling);
    const productionReport =
      productionCapture && fullProductionProof
        ? buildRuntimeProductionReport(productionCapture, initialBoundary.presetApplication ?? undefined)
        : undefined;
    const result: RuntimeVariantResultV1 = {
      ...projectRuntimeVariantStart(variant, initialBoundary, effectiveSeed, fixture.recipe.mapLabel),
      stopReason,
      outcomeDigest,
      ...(productionCapture
        ? fullProductionProof
          ? applicableScenarioIds.every((id) => id === "H-18") && productionReport
            ? compactRuntimeProductionReport(productionReport)
            : productionReport
          : { productionCapture }
        : {}),
      checkpoints,
      perturbations,
      aiErrors: [...aiErrors],
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
    // Lifecycle controls act only after the original match's native history, event facts and result have been detached.
    await afterVariant?.(page, result);
    return result;
  } finally {
    await context.close();
  }
}

async function advanceRuntimeToTick(
  page: Page,
  fixture: RuntimeFixtureV1,
  targetTick: number,
  checkpointIndex: number
) {
  if (fixture.recipe.fixedStepFrames) return advanceRuntimeFrames(page, fixture.recipe.aiPlayerNumber, targetTick);
  await setSimulationState(
    page,
    fixture.recipe.aiPlayerNumber,
    "resume",
    checkpointIndex === 0 ? 1 : fixture.recipe.simulationTimeScale,
    targetTick
  );
  await waitForSimulationTick(page, fixture.recipe.aiPlayerNumber, targetTick);
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
  scale: number,
  stopAtTick?: number
): Promise<void> {
  await page.evaluate(
    ({ playerNumber, nextState, timeScale, stopAtTick }) => {
      const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber);
      if (!parts) throw new Error("runtime_controller_unavailable");
      parts.tickService.setSimulationTimeScale(timeScale);
      if (nextState === "pause") parts.tickService.pauseTick("manual");
      else {
        if (stopAtTick !== undefined) {
          if (parts.tickService.currentTick >= stopAtTick) return;
          const subscription = parts.tickService.tick$.subscribe((tick) => {
            if (tick < stopAtTick) return;
            parts.tickService.pauseTick("manual");
            subscription.unsubscribe();
          });
        }
        parts.tickService.resumeTick("manual");
      }
    },
    { playerNumber: aiPlayerNumber, nextState: state, timeScale: scale, stopAtTick }
  );
}

/** Read the existing optional browser performance sample without expanding ordinary match work. */
async function readRuntimeLongTasks(page: Page, profiling: boolean) {
  if (!profiling) return null;
  return page.evaluate(() => {
    const metrics = (window as unknown as {
      __skirmishPerf?: { count: number; totalMs: number; maximumMs: number };
    }).__skirmishPerf;
    return metrics ? { count: metrics.count, totalMs: Math.round(metrics.totalMs), maximumMs: Math.round(metrics.maximumMs) } : null;
  });
}
