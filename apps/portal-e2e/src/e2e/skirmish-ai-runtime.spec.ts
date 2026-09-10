import { expect, test, type Browser, type Page } from "@playwright/test";

const runtimeRequestText = process.env.AI_SKIRMISH_RUNTIME_REQUEST;
const resultPrefix = "AI_SKIRMISH_RUNTIME_RESULT_V1:";

interface RuntimeVariantV1 {
  readonly id: string;
  readonly seed: number;
  readonly mapLabel?: string;
  readonly aiFaction: "Tivara" | "Skaduwee";
  readonly humanFaction: "Tivara" | "Skaduwee";
  readonly difficulty: "Easy" | "Normal" | "Hard";
}

interface RuntimeFixtureV1 {
  readonly schemaVersion: 1;
  readonly evidenceKind: "runtime";
  readonly scenarioIds: readonly string[];
  readonly recipe: {
    readonly mapLabel: string;
    readonly aiPlayerNumber: number;
    readonly simulationTimeScale: number;
    readonly checkpointTicks: readonly number[];
    readonly variants: readonly RuntimeVariantV1[];
  };
  readonly assertions: Readonly<
    Record<
      string,
      {
        readonly minimumDecisions: number;
        readonly minimumAppliedCommands: number;
        readonly requiredOpeningSteps: readonly string[];
        readonly requireNoInitialWorker: boolean;
        readonly requireDeliveredIncome: boolean;
        readonly requiredAiFactions: readonly RuntimeVariantV1["aiFaction"][];
      }
    >
  >;
}

interface RuntimeRequestV1 {
  readonly schemaVersion: 1;
  readonly sourceRevision: string;
  readonly dirtySourceDigest: string | null;
  readonly fixtureDigest: string;
  readonly seed: number | null;
  readonly scenarioIds: readonly string[];
  readonly fixtures: readonly RuntimeFixtureV1[];
}

interface RuntimeCheckpointV1 {
  readonly targetTick: number;
  readonly tick: number;
  readonly observationTick: number;
  readonly decisionSequence: number;
  readonly faction: number;
  readonly openingPlanId: string;
  readonly openingSteps: Readonly<Record<string, { readonly state: string; readonly completedTick: number | null }>>;
  readonly workerCount: number;
  readonly deliveredIncome: number;
  readonly appliedCommands: readonly { readonly commandId: string; readonly effectId: string }[];
  readonly terminalFailureCount: number;
  readonly terminalFailureReasons: Readonly<Record<string, number>>;
  readonly ownedActorNames: readonly string[];
  readonly ownedConstruction: readonly {
    readonly actorId: string;
    readonly objectName: string;
    readonly progress: number;
  }[];
  readonly workerOrders: readonly {
    readonly actorId: string;
    readonly orderType: string | null;
    readonly targetActorId: string | null;
  }[];
  readonly workerConstructs: Readonly<Record<string, readonly string[]>>;
  readonly constructionCellCount: number;
  readonly legalConstructionCellCount: number;
  readonly ownedMainBuildingNames: readonly string[];
  readonly sceneComponentNames: readonly string[];
  readonly mapBoundsStatus: string;
  readonly resourceStockpiles: Readonly<Record<string, number>>;
  readonly recentMacroDecisions: readonly string[];
}

interface RuntimeVariantResultV1 {
  readonly variantId: string;
  readonly seed: number;
  readonly aiFaction: RuntimeVariantV1["aiFaction"];
  readonly initialOwnedActorCount: number;
  readonly initialWorkerCount: number;
  readonly checkpoints: readonly RuntimeCheckpointV1[];
  readonly aiErrors: readonly string[];
}

interface RuntimePageControllerV1 {
  isDecisionBoundarySettled(): boolean;
  getCommittedObservation():
    | {
        tick: number;
        faction: number;
        actors: {
          actorId: string;
          relation: string;
          visibility: string;
          objectName: string;
          mainBuilding?: { status: "known"; value: boolean } | { status: "unknown" };
          constructionProgress?: { status: "known"; value: number } | { status: "unknown" };
          activeOrder?:
            | { status: "known"; value: { orderType: string; targetActorId: string | null } | null }
            | { status: "unknown" };
        }[];
        resources: {
          resourceType: string;
          stockpile: number;
          deliveredIncomePerMinute: { status: "known"; value: number } | { status: "unknown" };
        }[];
        map?: {
          bounds: { status: string };
          constructionCells?: { groundPassable: boolean; observedBlocked: boolean }[];
        };
      }
    | undefined;
  getBrainState():
    | {
        scheduler: { decisionSequence: number };
        opening: {
          plan: {
            planId: string;
            steps: { stepId: string; state: string; completedTick: number | null }[];
          };
        };
      }
    | undefined;
  getCommittedCapabilityCatalog():
    | { entries: { gathers: unknown[]; constructs: string[]; sourceObjectName: string }[] }
    | undefined;
  getBrainDebugSnapshot():
    | {
        decisions: {
          outcome: string;
          reason: string;
          detail?: string;
          intent: { kind: string; reasonCode: string; objectName?: string };
        }[];
      }
    | undefined;
  getBrainCommandBridgeSnapshot():
    | {
        outcomes: {
          kind: string;
          identity: { commandId: string; effectId: string };
          reason?: string;
        }[];
      }
    | undefined;
}

interface RuntimePageTickServiceV1 {
  currentTick: number;
  setSimulationTimeScale(scale: number): void;
  pauseTick(reason: string): void;
  resumeTick(reason: string): void;
}

interface RuntimePagePartsV1 {
  readonly controller: RuntimePageControllerV1;
  readonly tickService: RuntimePageTickServiceV1;
  readonly sceneComponentNames: readonly string[];
}

declare global {
  interface Window {
    __fuzzyWaddleAiRuntimePartsV1?: (playerNumber: number) => RuntimePagePartsV1 | null;
  }
}

test.skip(!runtimeRequestText, "The skirmish AI runtime driver is invoked only by the matrix runner.");
test.setTimeout(300_000);

test("executes selected AI scenarios in real lobby-started Phaser matches", async ({ browser }) => {
  const request = parseRequest(runtimeRequestText);
  const scenarioResults: {
    scenarioId: string;
    passed: boolean;
    failures: string[];
    variants: RuntimeVariantResultV1[];
  }[] = [];

  for (const scenarioId of request.scenarioIds) {
    const fixture = request.fixtures.find((candidate) => candidate.scenarioIds.includes(scenarioId));
    if (!fixture) throw new Error(`runtime_fixture_missing:${scenarioId}`);
    const variants: RuntimeVariantResultV1[] = [];
    for (const variant of fixture.recipe.variants) {
      variants.push(await runVariant(browser, fixture, variant, request.seed));
    }
    const failures = evaluateScenario(scenarioId, fixture, variants);
    scenarioResults.push({ scenarioId, passed: failures.length === 0, failures, variants });
  }

  const report = {
    schemaVersion: 1,
    sourceRevision: request.sourceRevision,
    dirtySourceDigest: request.dirtySourceDigest,
    fixtureDigest: request.fixtureDigest,
    status: scenarioResults.every((result) => result.passed) ? "passed" : "failed",
    scenarios: scenarioResults,
    workCounts: {
      scenarios: scenarioResults.length,
      decisions: scenarioResults.reduce(
        (sum, result) =>
          sum +
          result.variants.reduce((variantSum, variant) => variantSum + last(variant.checkpoints).decisionSequence, 0),
        0
      ),
      ticks: scenarioResults.reduce(
        (sum, result) =>
          sum + result.variants.reduce((variantSum, variant) => variantSum + last(variant.checkpoints).tick, 0),
        0
      )
    }
  } as const;
  console.log(`${resultPrefix}${JSON.stringify(report)}`);
  expect(report.workCounts.decisions).toBeGreaterThan(0);
  expect(report.workCounts.ticks).toBeGreaterThan(0);
  expect(scenarioResults.flatMap((result) => result.failures)).toEqual([]);
});

async function runVariant(
  browser: Browser,
  fixture: RuntimeFixtureV1,
  variant: RuntimeVariantV1,
  requestedSeed: number | null
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
    const checkpointTicks = [...new Set(fixture.recipe.checkpointTicks)].sort((left, right) => left - right);
    for (const [index, targetTick] of checkpointTicks.entries()) {
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
      aiErrors
    };
  } finally {
    await context.close();
  }
}

async function installRuntimeAccessor(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      !!(
        window as unknown as {
          __fuzzyWaddleAiRuntimeBrowserTestV1?: unknown;
        }
      ).__fuzzyWaddleAiRuntimeBrowserTestV1,
    undefined,
    { timeout: 120_000 }
  );
  await page.evaluate(() => {
    window.__fuzzyWaddleAiRuntimePartsV1 = (playerNumber: number) => {
      const host = (
        window as unknown as {
          __fuzzyWaddleAiRuntimeBrowserTestV1?: {
            game: {
              scene: {
                getScenes(active: boolean): {
                  scene: { key: string };
                  getSceneGameData?: () => { systems: unknown[]; services: unknown[]; components: unknown[] };
                }[];
              };
            };
          };
        }
      ).__fuzzyWaddleAiRuntimeBrowserTestV1;
      const scene = host?.game.scene
        .getScenes(true)
        .find((candidate) => candidate.scene.key.startsWith("Map") && candidate.getSceneGameData);
      const graph = scene?.getSceneGameData?.();
      if (!graph) return null;
      const handler = graph.systems.find(
        (candidate): candidate is { getAiPlayerController(player: number): RuntimePageControllerV1 | undefined } =>
          !!candidate && typeof (candidate as { getAiPlayerController?: unknown }).getAiPlayerController === "function"
      );
      const tickService = graph.services.find(
        (candidate): candidate is RuntimePageTickServiceV1 =>
          !!candidate &&
          typeof (candidate as { setSimulationTimeScale?: unknown }).setSimulationTimeScale === "function" &&
          typeof (candidate as { currentTick?: unknown }).currentTick === "number"
      );
      const controller = handler?.getAiPlayerController(playerNumber);
      return controller && tickService
        ? {
            controller,
            tickService,
            sceneComponentNames: graph.components.map((component) => component?.constructor?.name ?? "unknown")
          }
        : null;
    };
  });
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

async function captureCheckpoint(page: Page, aiPlayerNumber: number, targetTick: number): Promise<RuntimeCheckpointV1> {
  return page.evaluate(
    ({ playerNumber, expectedTick }) => {
      const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber);
      if (!parts) throw new Error("runtime_controller_unavailable");
      const observation = parts.controller.getCommittedObservation();
      const state = parts.controller.getBrainState();
      const catalog = parts.controller.getCommittedCapabilityCatalog();
      const bridge = parts.controller.getBrainCommandBridgeSnapshot();
      const debug = parts.controller.getBrainDebugSnapshot();
      if (!observation || !state || !catalog || !bridge || !debug) throw new Error("runtime_checkpoint_not_committed");
      const selfActors = observation.actors.filter(
        (actor) => actor.relation === "self" && actor.visibility === "owned"
      );
      const workerNames = new Set(
        catalog.entries.filter((entry) => entry.gathers.length > 0).map((entry) => entry.sourceObjectName)
      );
      const terminalFailureReasons: Record<string, number> = {};
      bridge.outcomes
        .filter((outcome) => ["rejected", "cancelled", "failed"].includes(outcome.kind))
        .forEach((outcome) => {
          const reason = outcome.reason ?? "unknown";
          terminalFailureReasons[reason] = (terminalFailureReasons[reason] ?? 0) + 1;
        });
      return {
        targetTick: expectedTick,
        tick: parts.tickService.currentTick,
        observationTick: observation.tick,
        decisionSequence: state.scheduler.decisionSequence,
        faction: observation.faction,
        openingPlanId: state.opening.plan.planId,
        openingSteps: Object.fromEntries(
          state.opening.plan.steps.map((step) => [
            step.stepId,
            { state: step.state, completedTick: step.completedTick }
          ])
        ),
        workerCount: selfActors.filter((actor) => workerNames.has(actor.objectName)).length,
        deliveredIncome: observation.resources.reduce(
          (total, resource) =>
            total +
            (resource.deliveredIncomePerMinute.status === "known" ? resource.deliveredIncomePerMinute.value : 0),
          0
        ),
        appliedCommands: bridge.outcomes
          .filter((outcome) => outcome.kind === "applied")
          .map((outcome) => ({
            commandId: outcome.identity.commandId,
            effectId: outcome.identity.effectId
          })),
        terminalFailureCount: bridge.outcomes.filter((outcome) =>
          ["rejected", "cancelled", "failed"].includes(outcome.kind)
        ).length,
        terminalFailureReasons,
        ownedActorNames: selfActors.map((actor) => actor.objectName).sort(),
        ownedConstruction: selfActors
          .filter((actor) => actor.constructionProgress?.status === "known")
          .map((actor) => ({
            actorId: actor.actorId,
            objectName: actor.objectName,
            progress: actor.constructionProgress!.status === "known" ? actor.constructionProgress!.value : 100
          }))
          .sort((left, right) => left.actorId.localeCompare(right.actorId)),
        workerOrders: selfActors
          .filter((actor) => workerNames.has(actor.objectName))
          .map((actor) => ({
            actorId: actor.actorId,
            orderType: actor.activeOrder?.status === "known" ? (actor.activeOrder.value?.orderType ?? null) : null,
            targetActorId:
              actor.activeOrder?.status === "known" ? (actor.activeOrder.value?.targetActorId ?? null) : null
          }))
          .sort((left, right) => left.actorId.localeCompare(right.actorId)),
        workerConstructs: Object.fromEntries(
          catalog.entries
            .filter((entry) => entry.gathers.length > 0)
            .map((entry) => [entry.sourceObjectName, [...entry.constructs].sort()])
        ),
        constructionCellCount: observation.map?.constructionCells?.length ?? 0,
        legalConstructionCellCount:
          observation.map?.constructionCells?.filter((cell) => cell.groundPassable && !cell.observedBlocked).length ??
          0,
        ownedMainBuildingNames: selfActors
          .filter((actor) => actor.mainBuilding?.status === "known" && actor.mainBuilding.value)
          .map((actor) => actor.objectName)
          .sort(),
        sceneComponentNames: [...parts.sceneComponentNames].sort(),
        mapBoundsStatus: observation.map?.bounds.status ?? "absent",
        resourceStockpiles: Object.fromEntries(
          observation.resources.map((resource) => [resource.resourceType, resource.stockpile])
        ),
        recentMacroDecisions: debug.decisions
          .filter(
            (decision) =>
              decision.intent.reasonCode.startsWith("opening:") ||
              decision.intent.reasonCode.startsWith("supply_buffer:")
          )
          .map((decision) =>
            [
              decision.outcome,
              decision.reason,
              decision.detail,
              decision.intent.kind,
              decision.intent.objectName,
              decision.intent.reasonCode
            ]
              .filter((value) => value !== undefined)
              .join(":")
          )
      };
    },
    { playerNumber: aiPlayerNumber, expectedTick: targetTick }
  );
}

function evaluateScenario(
  scenarioId: string,
  fixture: RuntimeFixtureV1,
  variants: readonly RuntimeVariantResultV1[]
): string[] {
  const assertion = fixture.assertions[scenarioId];
  if (!assertion) return [`runtime_assertions_missing:${scenarioId}`];
  const failures: string[] = [];
  const actualFactions = [...new Set(variants.map((variant) => variant.aiFaction))].sort();
  const requiredFactions = [...assertion.requiredAiFactions].sort();
  if (JSON.stringify(actualFactions) !== JSON.stringify(requiredFactions)) failures.push("required_ai_factions");
  if (assertion.requireNoInitialWorker && !variants.some((variant) => variant.initialWorkerCount === 0)) {
    failures.push("no_no_worker_variant");
  }
  for (const variant of variants) {
    const final = last(variant.checkpoints);
    const appliedCommands = new Map(
      variant.checkpoints
        .flatMap((checkpoint) => checkpoint.appliedCommands)
        .map((command) => [command.commandId, command])
    );
    if (final.decisionSequence < assertion.minimumDecisions) failures.push(`${variant.variantId}:minimum_decisions`);
    if (appliedCommands.size < assertion.minimumAppliedCommands)
      failures.push(`${variant.variantId}:minimum_applied_commands`);
    if (assertion.requireDeliveredIncome && !variant.checkpoints.some((checkpoint) => checkpoint.deliveredIncome > 0))
      failures.push(`${variant.variantId}:delivered_income`);
    if (final.workerCount < 1) failures.push(`${variant.variantId}:worker_bootstrap`);
    if (new Set(variant.checkpoints.map((checkpoint) => checkpoint.openingPlanId)).size !== 1)
      failures.push(`${variant.variantId}:opening_plan_restarted`);
    for (const stepId of assertion.requiredOpeningSteps) {
      const completionIndex = variant.checkpoints.findIndex(
        (checkpoint) => checkpoint.openingSteps[stepId]?.state === "completed"
      );
      if (completionIndex < 0) failures.push(`${variant.variantId}:opening_step:${stepId}`);
      else if (
        variant.checkpoints
          .slice(completionIndex)
          .some((checkpoint) => checkpoint.openingSteps[stepId]?.state !== "completed")
      ) {
        failures.push(`${variant.variantId}:opening_step_regressed:${stepId}`);
      }
    }
    const appliedCommandIdsByEffect = new Map<string, Set<string>>();
    for (const command of appliedCommands.values()) {
      const commandIds = appliedCommandIdsByEffect.get(command.effectId) ?? new Set<string>();
      commandIds.add(command.commandId);
      appliedCommandIdsByEffect.set(command.effectId, commandIds);
    }
    if ([...appliedCommandIdsByEffect.values()].some((commandIds) => commandIds.size > 1)) {
      failures.push(`${variant.variantId}:duplicate_applied_effect`);
    }
    failures.push(...variant.aiErrors.map((error) => `${variant.variantId}:ai_error:${error}`));
  }
  return failures;
}

function parseRequest(value: string | undefined): RuntimeRequestV1 {
  if (!value) throw new Error("runtime_request_missing");
  const parsed = JSON.parse(value) as RuntimeRequestV1;
  if (
    parsed.schemaVersion !== 1 ||
    !/^[a-f0-9]{40}$/.test(parsed.sourceRevision) ||
    (parsed.dirtySourceDigest !== null && !/^fnv1a32:[a-f0-9]{8}$/.test(parsed.dirtySourceDigest)) ||
    !/^fnv1a32:[a-f0-9]{8}$/.test(parsed.fixtureDigest) ||
    (parsed.seed !== null && (!Number.isSafeInteger(parsed.seed) || parsed.seed < 0)) ||
    !Array.isArray(parsed.scenarioIds) ||
    parsed.scenarioIds.length === 0 ||
    !Array.isArray(parsed.fixtures) ||
    parsed.fixtures.length === 0
  ) {
    throw new Error("runtime_request_malformed");
  }
  return parsed;
}

function last<T>(values: readonly T[]): T {
  const value = values.at(-1);
  if (value === undefined) throw new Error("runtime_values_empty");
  return value;
}
