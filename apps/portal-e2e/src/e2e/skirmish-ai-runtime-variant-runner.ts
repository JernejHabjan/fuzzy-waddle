import type { Browser, Page } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { installRuntimeAccessor } from "./skirmish-ai-runtime-browser-accessor";
import { captureCheckpoint } from "./skirmish-ai-runtime-checkpoint-capture";
import { last } from "./skirmish-ai-runtime-value";

export async function runVariant(
  browser: Browser,
  fixture: RuntimeFixtureV1,
  variant: RuntimeVariantV1,
  requestedSeed: number | null,
  requestedScenarioIds: readonly string[]
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
    ({ seed }) => {
      window.sessionStorage.setItem(
        "fuzzy-waddle:ai-runtime-browser-test-v1",
        JSON.stringify({ schemaVersion: 1, enabled: true, seed, startPaused: true })
      );
    },
    { seed: effectiveSeed }
  );

  try {
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
    await installRuntimeAccessor(page);
    await waitForRuntimeController(page, fixture.recipe.aiPlayerNumber);
    const initialState = await page.evaluate((playerNumber) => {
      const state = (
        window as unknown as {
          __fuzzyWaddleAiRuntimeBrowserTestV1?: {
            initialStateByPlayer: Record<number, { ownedActorCount: number; workerCount: number }>;
          };
        }
      ).__fuzzyWaddleAiRuntimeBrowserTestV1?.initialStateByPlayer[playerNumber];
      if (!state) throw new Error("runtime_initial_state_unavailable");
      return state;
    }, fixture.recipe.aiPlayerNumber);
    const checkpoints: RuntimeCheckpointV1[] = [];
    const perturbations: { id: string; tick: number; dispatchedActors: number }[] = [];
    const pendingPerturbations = [...(variant.perturbations ?? [])].sort(
      (left, right) => left.tick - right.tick || left.id.localeCompare(right.id)
    );
    const maximumTick = Math.max(
      ...requestedScenarioIds
        .filter((scenarioId) => variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
        .map((scenarioId) => fixture.assertions[scenarioId]?.maximumTick ?? last(fixture.recipe.checkpointTicks))
    );
    const checkpointTicks = [...new Set(fixture.recipe.checkpointTicks)]
      .filter((tick) => tick <= maximumTick)
      .sort((left, right) => left - right);
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
        const targetActorId = await page.evaluate((playerNumber) => {
          const observation = window
            .__fuzzyWaddleAiRuntimePartsV1?.(playerNumber)
            ?.controller.getCommittedObservation();
          return observation?.actors.find(
            (actor) =>
              actor.relation === "self" &&
              actor.visibility === "owned" &&
              actor.mainBuilding?.status === "known" &&
              actor.mainBuilding.value
          )?.actorId;
        }, fixture.recipe.aiPlayerNumber);
        if (!targetActorId) {
          perturbations.push({ id: perturbation.id, tick: perturbation.tick, dispatchedActors: 0 });
          continue;
        }
        const dispatched = await page.evaluate(
          ({ aiPlayerNumber, targetId, maximumAttackers }) => {
            const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(aiPlayerNumber);
            if (!parts) throw new Error("runtime_controller_unavailable");
            return parts.dispatchHumanRaid(1, targetId, maximumAttackers);
          },
          {
            aiPlayerNumber: fixture.recipe.aiPlayerNumber,
            targetId: targetActorId,
            maximumAttackers: perturbation.maximumAttackers
          }
        );
        perturbations.push({
          id: perturbation.id,
          tick: perturbation.tick,
          dispatchedActors: dispatched.status === "dispatched" ? dispatched.dispatchedActors : 0
        });
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
    }

    return {
      variantId: variant.id,
      seed: effectiveSeed,
      aiFaction: variant.aiFaction,
      initialOwnedActorCount: initialState.ownedActorCount,
      initialWorkerCount: initialState.workerCount,
      checkpoints,
      perturbations,
      aiErrors
    };
  } finally {
    await context.close();
  }
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
