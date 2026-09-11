import { expect, test, type Browser, type Page } from "@playwright/test";

const runtimeRequestText = process.env.AI_SKIRMISH_RUNTIME_REQUEST;
const resultPrefix = "AI_SKIRMISH_RUNTIME_RESULT_V1:";

interface RuntimeVariantV1 {
  readonly id: string;
  readonly scenarioIds?: readonly string[];
  readonly seed: number;
  readonly mapLabel?: string;
  readonly aiFaction: "Tivara" | "Skaduwee";
  readonly humanFaction: "Tivara" | "Skaduwee";
  readonly difficulty: "Easy" | "Normal" | "Hard";
  readonly perturbations?: readonly {
    readonly id: string;
    readonly tick: number;
    readonly kind: "human_attack_ai_home";
    readonly maximumAttackers: number;
  }[];
}

interface RuntimeAssertionV1 {
  readonly maximumTick?: number;
  readonly minimumDecisions: number;
  readonly minimumAppliedCommands: number;
  readonly requiredOpeningSteps?: readonly string[];
  readonly requireNoInitialWorker?: boolean;
  readonly requireDeliveredIncome?: boolean;
  readonly requiredAiFactions: readonly RuntimeVariantV1["aiFaction"][];
  readonly minimumMilitaryCount?: number;
  readonly minimumMilitaryTypeCount?: number;
  readonly minimumRepeatedMilitaryTypeCount?: number;
  readonly minimumMilitaryProducerCount?: number;
  readonly maximumMilitaryProducerCount?: number;
  readonly requireCompositionDemand?: boolean;
  readonly requireCapacityDemand?: boolean;
  readonly requireProductionStopsAtTarget?: boolean;
  readonly maximumQueueOccupancyPerProducer?: number;
  readonly firstOffensiveLaunchByTick?: number;
  readonly minimumOffensiveLaunchCount?: number;
  readonly minimumDamageDealt?: number;
  readonly minimumEnemyLosses?: number;
  readonly requireMissionContinuation?: boolean;
  readonly requireTerminalResult?: boolean;
  readonly requireRaidDefenseRecovery?: boolean;
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
  readonly assertions: Readonly<Record<string, RuntimeAssertionV1>>;
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
  readonly recentCommandFailures: readonly {
    readonly kind: string;
    readonly reason: string;
    readonly detail: string | null;
    readonly effectId: string | null;
  }[];
  readonly ownedActorNames: readonly string[];
  readonly rawOwnedActorNames: readonly string[];
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
  readonly profileDifficulty: string | null;
  readonly strategyStance: string;
  readonly demands: readonly {
    readonly demandId: string;
    readonly purpose: string;
    readonly desired: number;
    readonly satisfied: number;
    readonly queued: number;
    readonly constructing: number;
    readonly accepted: number;
  }[];
  readonly militaryActorNames: readonly string[];
  readonly militaryProducerNames: readonly string[];
  readonly militaryProducerQueues: readonly {
    readonly actorId: string;
    readonly objectName: string;
    readonly capacity: number;
    readonly occupied: number;
    readonly queuedObjectNames: readonly string[];
  }[];
  readonly squads: readonly {
    readonly squadId: string;
    readonly role: string;
    readonly state: string;
    readonly actorCount: number;
    readonly objectiveId: string | null;
    readonly createdTick: number | null;
    readonly lastUsefulEffectTick: number | null;
    readonly terminalReason: string | null;
  }[];
  readonly objectiveContacts: readonly {
    readonly squadId: string;
    readonly actorId: string;
    readonly objectName: string | null;
    readonly visibility: string | null;
    readonly observedTick: number | null;
    readonly positionObservedTick: number | null;
    readonly healthPermille: number | null;
  }[];
  readonly adaptationEvidence: readonly {
    readonly kind: string;
    readonly sourceContactId: string;
    readonly observedTick: number;
    readonly confidencePermille: number;
  }[];
  readonly bases: readonly {
    readonly baseId: string;
    readonly lifecycle: string;
    readonly anchorActorId: string | null;
    readonly reservedSiteKey: string | null;
    readonly rejectedSiteCount: number;
  }[];
  readonly reservations: readonly {
    readonly claimId: string;
    readonly subjectKey: string | null;
    readonly ownerPlanId: string;
    readonly state: string;
  }[];
  readonly missionTimeline: readonly { readonly tick: number; readonly detail: string }[];
  readonly modeGoals: readonly { readonly id: string; readonly owner: number | null; readonly state: string }[];
  readonly scoreMetrics: Readonly<Record<string, number>>;
  readonly gameResult: string | null;
}

interface RuntimeVariantResultV1 {
  readonly variantId: string;
  readonly seed: number;
  readonly aiFaction: RuntimeVariantV1["aiFaction"];
  readonly initialOwnedActorCount: number;
  readonly initialWorkerCount: number;
  readonly checkpoints: readonly RuntimeCheckpointV1[];
  readonly perturbations: readonly { readonly id: string; readonly tick: number; readonly dispatchedActors: number }[];
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
          observedTick: number;
          logicalPosition:
            | { status: "known"; value: { x: number; y: number; z: number }; observedTick: number }
            | { status: "unknown" };
          healthPermille?: { status: "known"; value: number } | { status: "unknown" };
          queue:
            | {
                status: "known";
                value: {
                  capacity: number;
                  occupied: number;
                  items?: readonly { kind: string; objectName: string | null }[];
                };
              }
            | { status: "unknown" };
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
        modeGoals: { id: string; owner: number | null; state: string }[];
        map?: {
          bounds: { status: string };
          constructionCells?: { groundPassable: boolean; observedBlocked: boolean }[];
        };
      }
    | undefined;
  getBrainState():
    | {
        scheduler: { decisionSequence: number };
        profileDifficulty?: string;
        strategy: { stance: string };
        opening: {
          plan: {
            planId: string;
            steps: { stepId: string; state: string; completedTick: number | null }[];
          };
        };
        economyProduction: {
          demands: {
            demandId: string;
            purpose: string;
            desired: number;
            satisfiedActorIds: string[];
            queuedIds: string[];
            constructingIds: string[];
            acceptedNotObservedEffectIds: string[];
          }[];
          adaptation: {
            evidence: {
              kind: string;
              sourceContactId: string;
              observedTick: number;
              confidencePermille: number;
            }[];
          };
        };
        squads: {
          squadId: string;
          role: string;
          state: string;
          actorIds: string[];
          objectiveId: string | null;
          lifecycle?: {
            createdTick: number;
            lastUsefulEffectTick: number | null;
            terminalReason: string | null;
          };
        }[];
        bases: {
          baseId: string;
          lifecycle: string;
          anchorActorId: string | null;
          reservedSiteKey?: string | null;
          rejectedSiteKeys?: { siteKey: string }[];
        }[];
        reservations: {
          claimId: string;
          subjectKey?: string;
          ownerPlanId: string;
          state: { kind: string };
        }[];
        skirmish: { timeline: { tick: number; kind: string; detail: string }[] };
      }
    | undefined;
  getCommittedCapabilityCatalog():
    | {
        entries: {
          gathers: unknown[];
          constructs: string[];
          produces: string[];
          movementDomains: string[];
          targetDomains: string[];
          sourceObjectName: string;
        }[];
      }
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
  getScore(playerNumber: number): { metrics: Readonly<Record<string, number>>; gameResult: string | null };
  getRawOwnedActorNames(playerNumber: number): readonly string[];
  getCommandOutcomes(): readonly {
    kind: string;
    reason: string;
    detail?: string;
    effectId?: string;
  }[];
  dispatchHumanRaid(
    humanPlayerNumber: number,
    targetActorId: string,
    maximumAttackers: number
  ): { status: string; dispatchedActors: number };
}

declare global {
  interface Window {
    __fuzzyWaddleAiRuntimePartsV1?: (playerNumber: number) => RuntimePagePartsV1 | null;
  }
}

test.skip(!runtimeRequestText, "The skirmish AI runtime driver is invoked only by the matrix runner.");
test.setTimeout(900_000);

test("executes selected AI scenarios in real lobby-started Phaser matches", async ({ browser }) => {
  const request = parseRequest(runtimeRequestText);
  const fixtureRuns = new Map<RuntimeFixtureV1, readonly RuntimeVariantResultV1[]>();
  const scenarioResults: {
    scenarioId: string;
    passed: boolean;
    failures: string[];
    variants: readonly RuntimeVariantResultV1[];
  }[] = [];

  for (const scenarioId of request.scenarioIds) {
    const fixture = request.fixtures.find((candidate) => candidate.scenarioIds.includes(scenarioId));
    if (!fixture) throw new Error(`runtime_fixture_missing:${scenarioId}`);
    let variants = fixtureRuns.get(fixture);
    if (!variants) {
      const executed: RuntimeVariantResultV1[] = [];
      for (const variant of fixture.recipe.variants.filter(
        (candidate) =>
          candidate.scenarioIds === undefined || candidate.scenarioIds.some((id) => request.scenarioIds.includes(id))
      )) {
        executed.push(await runVariant(browser, fixture, variant, request.seed, request.scenarioIds));
      }
      variants = executed;
      fixtureRuns.set(fixture, variants);
    }
    const applicableVariantIds = new Set(
      fixture.recipe.variants
        .filter((variant) => variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
        .map((variant) => variant.id)
    );
    const scenarioVariants = variants.filter((variant) => applicableVariantIds.has(variant.variantId));
    const failures = evaluateScenario(scenarioId, fixture, scenarioVariants);
    scenarioResults.push({ scenarioId, passed: failures.length === 0, failures, variants: scenarioVariants });
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
      decisions: [...fixtureRuns.values()].reduce(
        (sum, variants) =>
          sum + variants.reduce((variantSum, variant) => variantSum + last(variant.checkpoints).decisionSequence, 0),
        0
      ),
      ticks: [...fixtureRuns.values()].reduce(
        (sum, variants) =>
          sum + variants.reduce((variantSum, variant) => variantSum + last(variant.checkpoints).tick, 0),
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
        const perturbation = pendingPerturbations.shift()!;
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
      const actorIndex = graph.services.find(
        (
          candidate
        ): candidate is {
          getOwnedActors(playerNumber: number): {
            name: string;
            getData(key: string): {
              components: Map<{ name: string }, Record<string, unknown>>;
            } | null;
          }[];
        } => !!candidate && typeof (candidate as { getOwnedActors?: unknown }).getOwnedActors === "function"
      );
      const commandBus = graph.services.find(
        (
          candidate
        ): candidate is {
          dispatchDeterministic(command: {
            type: "ACTOR_ACTION";
            playerNumber: number;
            actorIds: string[];
            orderType: "Attack";
            targetObjectIds: string[];
            queue: false;
          }): { status: string };
          getAuthorityState(): {
            outcomes: {
              kind: string;
              reason: string;
              detail?: string;
              effectId?: string;
            }[];
          };
        } =>
          !!candidate &&
          typeof (candidate as { dispatchDeterministic?: unknown }).dispatchDeterministic === "function" &&
          typeof (candidate as { getAuthorityState?: unknown }).getAuthorityState === "function"
      );
      const scoreTracker = graph.systems.find(
        (
          candidate
        ): candidate is {
          getScoreData(): Map<number, { metrics: Record<string, number>; gameResult: string }> | undefined;
        } =>
          !!candidate &&
          typeof (candidate as { calculateFinalScore?: unknown }).calculateFinalScore === "function" &&
          typeof (candidate as { getMetric?: unknown }).getMetric === "function"
      );
      const controller = handler?.getAiPlayerController(playerNumber);
      return controller && tickService && actorIndex && commandBus && scoreTracker
        ? {
            controller,
            tickService,
            sceneComponentNames: graph.components.map((component) => component?.constructor?.name ?? "unknown"),
            getScore(requestedPlayerNumber: number) {
              const row = scoreTracker.getScoreData()?.get(requestedPlayerNumber);
              return { metrics: { ...(row?.metrics ?? {}) }, gameResult: row?.gameResult ?? null };
            },
            getRawOwnedActorNames(requestedPlayerNumber: number) {
              return actorIndex
                .getOwnedActors(requestedPlayerNumber)
                .map((actor) => actor.name)
                .sort();
            },
            getCommandOutcomes() {
              return commandBus.getAuthorityState().outcomes;
            },
            dispatchHumanRaid(humanPlayerNumber: number, targetActorId: string, maximumAttackers: number) {
              const component = (
                actor: ReturnType<typeof actorIndex.getOwnedActors>[number],
                componentName: string
              ): Record<string, unknown> | undefined => {
                const data = actor.getData("actorData");
                return data
                  ? [...data.components.entries()].find(([constructor]) => constructor.name === componentName)?.[1]
                  : undefined;
              };
              const actorIds = actorIndex
                .getOwnedActors(humanPlayerNumber)
                .filter((actor) => component(actor, "AttackComponent") && component(actor, "ActorTranslateComponent"))
                .map((actor) => component(actor, "IdComponent")?.["id"])
                .filter((id): id is string => typeof id === "string")
                .sort()
                .slice(0, Math.max(1, maximumAttackers));
              if (actorIds.length === 0) return { status: "no_attackers", dispatchedActors: 0 };
              const receipt = commandBus.dispatchDeterministic({
                type: "ACTOR_ACTION",
                playerNumber: humanPlayerNumber,
                actorIds,
                orderType: "Attack",
                targetObjectIds: [targetActorId],
                queue: false
              });
              return { status: receipt.status, dispatchedActors: actorIds.length };
            }
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
      const militaryNames = new Set(
        catalog.entries
          .filter(
            (entry) =>
              entry.gathers.length === 0 && entry.targetDomains.length > 0 && entry.movementDomains.includes("ground")
          )
          .map((entry) => entry.sourceObjectName)
      );
      const militaryProducerNames = new Set(
        catalog.entries
          .filter((entry) => entry.produces.some((objectName) => militaryNames.has(objectName)))
          .map((entry) => entry.sourceObjectName)
      );
      const score = parts.getScore(playerNumber);
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
        recentCommandFailures: parts
          .getCommandOutcomes()
          .filter((outcome) => ["rejected", "cancelled", "failed"].includes(outcome.kind))
          .slice(-50)
          .map((outcome) => ({
            kind: outcome.kind,
            reason: outcome.reason,
            detail: outcome.detail ?? null,
            effectId: outcome.effectId ?? null
          })),
        ownedActorNames: selfActors.map((actor) => actor.objectName).sort(),
        rawOwnedActorNames: [...parts.getRawOwnedActorNames(playerNumber)],
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
              decision.intent.reasonCode.startsWith("supply_buffer:") ||
              decision.intent.reasonCode.startsWith("capacity:") ||
              decision.intent.reasonCode.startsWith("composition:") ||
              decision.intent.reasonCode.startsWith("adapt:")
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
          ),
        profileDifficulty: state.profileDifficulty ?? null,
        strategyStance: state.strategy.stance,
        demands: state.economyProduction.demands
          .map((demand) => ({
            demandId: demand.demandId,
            purpose: demand.purpose,
            desired: demand.desired,
            satisfied: demand.satisfiedActorIds.length,
            queued: demand.queuedIds.length,
            constructing: demand.constructingIds.length,
            accepted: demand.acceptedNotObservedEffectIds.length
          }))
          .sort((left, right) => left.demandId.localeCompare(right.demandId)),
        militaryActorNames: selfActors
          .filter((actor) => militaryNames.has(actor.objectName))
          .map((actor) => actor.objectName)
          .sort(),
        militaryProducerNames: selfActors
          .filter(
            (actor) =>
              militaryProducerNames.has(actor.objectName) &&
              (actor.constructionProgress?.status !== "known" || actor.constructionProgress.value >= 100)
          )
          .map((actor) => actor.objectName)
          .sort(),
        militaryProducerQueues: selfActors
          .filter((actor) => militaryProducerNames.has(actor.objectName) && actor.queue.status === "known")
          .map((actor) => ({
            actorId: actor.actorId,
            objectName: actor.objectName,
            capacity: actor.queue.status === "known" ? actor.queue.value.capacity : 0,
            occupied: actor.queue.status === "known" ? actor.queue.value.occupied : 0,
            queuedObjectNames:
              actor.queue.status === "known"
                ? (actor.queue.value.items ?? [])
                    .flatMap((item) => (item.kind === "production" && item.objectName ? [item.objectName] : []))
                    .sort()
                : []
          }))
          .sort((left, right) => left.actorId.localeCompare(right.actorId)),
        squads: state.squads
          .map((squad) => ({
            squadId: squad.squadId,
            role: squad.role,
            state: squad.state,
            actorCount: squad.actorIds.length,
            objectiveId: squad.objectiveId,
            createdTick: squad.lifecycle?.createdTick ?? null,
            lastUsefulEffectTick: squad.lifecycle?.lastUsefulEffectTick ?? null,
            terminalReason: squad.lifecycle?.terminalReason ?? null
          }))
          .sort((left, right) => left.squadId.localeCompare(right.squadId)),
        objectiveContacts: state.squads
          .flatMap((squad) => {
            if (!squad.objectiveId) return [];
            const actor = observation.actors.find((candidate) => candidate.actorId === squad.objectiveId);
            return [
              {
                squadId: squad.squadId,
                actorId: squad.objectiveId,
                objectName: actor?.objectName ?? null,
                visibility: actor?.visibility ?? null,
                observedTick: actor?.observedTick ?? null,
                positionObservedTick:
                  actor?.logicalPosition.status === "known" ? actor.logicalPosition.observedTick : null,
                healthPermille: actor?.healthPermille?.status === "known" ? actor.healthPermille.value : null
              }
            ];
          })
          .sort((left, right) => left.squadId.localeCompare(right.squadId)),
        adaptationEvidence: state.economyProduction.adaptation.evidence
          .map((entry) => ({
            kind: entry.kind,
            sourceContactId: entry.sourceContactId,
            observedTick: entry.observedTick,
            confidencePermille: entry.confidencePermille
          }))
          .sort(
            (left, right) =>
              left.kind.localeCompare(right.kind) || left.sourceContactId.localeCompare(right.sourceContactId)
          ),
        bases: state.bases
          .map((base) => ({
            baseId: base.baseId,
            lifecycle: base.lifecycle,
            anchorActorId: base.anchorActorId,
            reservedSiteKey: base.reservedSiteKey ?? null,
            rejectedSiteCount: base.rejectedSiteKeys?.length ?? 0
          }))
          .sort((left, right) => left.baseId.localeCompare(right.baseId)),
        reservations: state.reservations
          .map((reservation) => ({
            claimId: reservation.claimId,
            subjectKey: reservation.subjectKey ?? null,
            ownerPlanId: reservation.ownerPlanId,
            state: reservation.state.kind
          }))
          .sort((left, right) => left.claimId.localeCompare(right.claimId)),
        missionTimeline: state.skirmish.timeline
          .filter((event) => event.kind === "mission")
          .map((event) => ({ tick: event.tick, detail: event.detail })),
        modeGoals: observation.modeGoals.map((goal) => ({ id: goal.id, owner: goal.owner, state: goal.state })),
        scoreMetrics: score.metrics,
        gameResult: score.gameResult
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
  const applicableVariantIds = new Set(
    fixture.recipe.variants
      .filter((variant) => variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
      .map((variant) => variant.id)
  );
  const selectedVariants = variants.filter((variant) => applicableVariantIds.has(variant.variantId));
  if (selectedVariants.length === 0) return [`runtime_variants_missing:${scenarioId}`];
  const failures: string[] = [];
  const actualFactions = [...new Set(selectedVariants.map((variant) => variant.aiFaction))].sort();
  const requiredFactions = [...assertion.requiredAiFactions].sort();
  if (JSON.stringify(actualFactions) !== JSON.stringify(requiredFactions)) failures.push("required_ai_factions");
  if (assertion.requireNoInitialWorker && !selectedVariants.some((variant) => variant.initialWorkerCount === 0)) {
    failures.push("no_no_worker_variant");
  }
  for (const variant of selectedVariants) {
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
    for (const stepId of assertion.requiredOpeningSteps ?? []) {
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
    const maximumMilitary = Math.max(...variant.checkpoints.map((checkpoint) => checkpoint.militaryActorNames.length));
    if (assertion.minimumMilitaryCount !== undefined && maximumMilitary < assertion.minimumMilitaryCount) {
      failures.push(`${variant.variantId}:minimum_military_count`);
    }
    const finalMilitaryTypeCounts = final.militaryActorNames.reduce<Record<string, number>>((counts, objectName) => {
      counts[objectName] = (counts[objectName] ?? 0) + 1;
      return counts;
    }, {});
    if (
      assertion.minimumMilitaryTypeCount !== undefined &&
      Object.keys(finalMilitaryTypeCounts).length < assertion.minimumMilitaryTypeCount
    ) {
      failures.push(`${variant.variantId}:minimum_military_type_count`);
    }
    if (
      assertion.minimumRepeatedMilitaryTypeCount !== undefined &&
      Math.max(0, ...Object.values(finalMilitaryTypeCounts)) < assertion.minimumRepeatedMilitaryTypeCount
    ) {
      failures.push(`${variant.variantId}:minimum_repeated_military_type_count`);
    }
    const maximumProducerCount = Math.max(
      ...variant.checkpoints.map((checkpoint) => checkpoint.militaryProducerNames.length)
    );
    if (
      assertion.minimumMilitaryProducerCount !== undefined &&
      maximumProducerCount < assertion.minimumMilitaryProducerCount
    ) {
      failures.push(`${variant.variantId}:minimum_military_producer_count`);
    }
    if (
      assertion.maximumMilitaryProducerCount !== undefined &&
      maximumProducerCount > assertion.maximumMilitaryProducerCount
    ) {
      failures.push(`${variant.variantId}:maximum_military_producer_count`);
    }
    const compositionDemands = variant.checkpoints.flatMap((checkpoint) =>
      checkpoint.demands.filter((demand) => demand.demandId === "demand:composition:first-squad")
    );
    const capacityDemands = variant.checkpoints.flatMap((checkpoint) =>
      checkpoint.demands.filter((demand) => demand.demandId === "demand:capacity:first-army")
    );
    if (assertion.requireCompositionDemand && compositionDemands.length === 0) {
      failures.push(`${variant.variantId}:composition_demand_missing`);
    }
    if (assertion.requireCapacityDemand && capacityDemands.length === 0) {
      failures.push(`${variant.variantId}:capacity_demand_missing`);
    }
    if (scenarioId === "PRO-03") {
      const capacityIndex = variant.checkpoints.findIndex((checkpoint) => checkpoint.militaryProducerNames.length >= 2);
      const fulfilledIndex = variant.checkpoints.findIndex((checkpoint) => {
        const demand = checkpoint.demands.find(
          (candidate) => candidate.demandId === "demand:composition:first-squad" && candidate.desired >= 12
        );
        return demand !== undefined && demand.satisfied + demand.queued + demand.accepted >= demand.desired;
      });
      const prebuilt = capacityIndex >= 0 && fulfilledIndex >= 0 && capacityIndex <= fulfilledIndex;
      if (!prebuilt) failures.push(`${variant.variantId}:capacity_not_prebuilt`);
    }
    if (assertion.requireProductionStopsAtTarget) {
      const fulfillmentIndex = variant.checkpoints.findIndex((checkpoint) => {
        const demand = checkpoint.demands.find((candidate) => candidate.demandId === "demand:composition:first-squad");
        return demand !== undefined && demand.satisfied + demand.queued + demand.accepted >= demand.desired;
      });
      if (fulfillmentIndex < 0) failures.push(`${variant.variantId}:composition_target_not_fulfilled`);
      else if (
        variant.checkpoints.slice(fulfillmentIndex).some((checkpoint) => {
          const demand = checkpoint.demands.find(
            (candidate) => candidate.demandId === "demand:composition:first-squad"
          );
          return demand !== undefined && demand.satisfied + demand.queued + demand.accepted > demand.desired;
        })
      ) {
        failures.push(`${variant.variantId}:composition_overproduction`);
      }
    }
    if (
      assertion.maximumQueueOccupancyPerProducer !== undefined &&
      variant.checkpoints.some((checkpoint) =>
        checkpoint.militaryProducerQueues.some(
          (producer) => producer.occupied > assertion.maximumQueueOccupancyPerProducer!
        )
      )
    ) {
      failures.push(`${variant.variantId}:producer_queue_overbooked`);
    }
    const launchEvents = [
      ...new Map(
        variant.checkpoints
          .flatMap((checkpoint) => checkpoint.missionTimeline)
          .filter((event) => event.detail.startsWith("launch:"))
          .map((event) => [`${event.tick}:${event.detail}`, event])
      ).values()
    ].sort((left, right) => left.tick - right.tick);
    if (
      assertion.firstOffensiveLaunchByTick !== undefined &&
      (launchEvents[0]?.tick ?? Number.POSITIVE_INFINITY) > assertion.firstOffensiveLaunchByTick
    ) {
      failures.push(`${variant.variantId}:first_offensive_launch_deadline`);
    }
    if (
      assertion.minimumOffensiveLaunchCount !== undefined &&
      launchEvents.length < assertion.minimumOffensiveLaunchCount
    ) {
      failures.push(`${variant.variantId}:minimum_offensive_launches`);
    }
    const finalDamage = final.scoreMetrics["damage_dealt"] ?? 0;
    const finalEnemyLosses =
      (final.scoreMetrics["units_killed"] ?? 0) + (final.scoreMetrics["buildings_destroyed"] ?? 0);
    if (assertion.minimumDamageDealt !== undefined && finalDamage < assertion.minimumDamageDealt) {
      failures.push(`${variant.variantId}:minimum_damage_dealt`);
    }
    if (assertion.minimumEnemyLosses !== undefined && finalEnemyLosses < assertion.minimumEnemyLosses) {
      failures.push(`${variant.variantId}:minimum_enemy_losses`);
    }
    if (assertion.requireMissionContinuation) {
      const damagingCheckpoints = variant.checkpoints.filter(
        (checkpoint) => (checkpoint.scoreMetrics["damage_dealt"] ?? 0) > 0
      );
      const firstDamage = damagingCheckpoints[0]?.scoreMetrics["damage_dealt"] ?? 0;
      const continued = damagingCheckpoints.some(
        (checkpoint, index) => index > 0 && (checkpoint.scoreMetrics["damage_dealt"] ?? 0) > firstDamage
      );
      if (!continued) failures.push(`${variant.variantId}:mission_pressure_did_not_continue`);
    }
    const hasTerminalResult =
      (final.gameResult !== null && final.gameResult.toLowerCase() !== "quit") ||
      final.modeGoals.some((goal) => goal.owner === 2 && goal.state === "completed");
    if (assertion.requireTerminalResult && !hasTerminalResult) {
      failures.push(`${variant.variantId}:terminal_result_missing`);
    }
    if (assertion.requireRaidDefenseRecovery) {
      const raid = variant.perturbations.find((perturbation) => perturbation.id === "home-raid");
      const beforeRaid = variant.checkpoints
        .filter((checkpoint) => checkpoint.tick < (raid?.tick ?? 0))
        .sort((left, right) => right.tick - left.tick)[0];
      const defenseSeen = variant.checkpoints.some(
        (checkpoint) =>
          checkpoint.tick >= (raid?.tick ?? Number.MAX_SAFE_INTEGER) &&
          checkpoint.squads.some((squad) => squad.role === "defense")
      );
      const interceptedOutsideHome = variant.checkpoints
        .filter((checkpoint) => checkpoint.tick >= (raid?.tick ?? Number.MAX_SAFE_INTEGER))
        .some(
          (checkpoint) =>
            (checkpoint.scoreMetrics["damage_dealt"] ?? 0) > (beforeRaid?.scoreMetrics["damage_dealt"] ?? 0) &&
            (checkpoint.scoreMetrics["units_killed"] ?? 0) +
              (checkpoint.scoreMetrics["buildings_destroyed"] ?? 0) >
              (beforeRaid?.scoreMetrics["units_killed"] ?? 0) +
                (beforeRaid?.scoreMetrics["buildings_destroyed"] ?? 0)
        );
      const recovered =
        raid !== undefined &&
        final.deliveredIncome > 0 &&
        final.strategyStance !== "defend" &&
        (hasTerminalResult || final.squads.some((squad) => squad.role === "attack" && squad.actorCount > 0));
      if (!raid || raid.dispatchedActors <= 0) failures.push(`${variant.variantId}:raid_not_dispatched`);
      if (!defenseSeen && !interceptedOutsideHome) failures.push(`${variant.variantId}:raid_defense_not_observed`);
      if (!recovered) failures.push(`${variant.variantId}:raid_recovery_not_observed`);
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
