import { join } from "node:path";
import { readJson } from "./skirmish-matrix-io.mjs";
import { validateEvidenceStopAssertions, validateRuntimeRecipeMetadata } from "./skirmish-runtime-recipe-metadata.mjs";
import { validProductionCapacityPair } from "./skirmish-runtime-production-capacity-fixture.mjs";

export function validateManifest(value, fixtureDirectory) {
  if (!value || value.schemaVersion !== 1 || value.manifestVersion !== "skirmish-v1" || !Array.isArray(value.rows))
    throw new Error("malformed_manifest");
  if (value.rows.length !== value.requiredCaseCount || value.requiredCaseCount !== 121)
    throw new Error(`manifest_case_count:${value.rows.length}`);
  if (!safeReference(value.baseline)) throw new Error("unsafe_baseline_manifest_reference");
  const ids = new Set();
  for (const row of value.rows) {
    if (!row || typeof row.id !== "string" || !/^[A-Z]+-[0-9]{2}$/.test(row.id) || ids.has(row.id))
      throw new Error(`invalid_manifest_row:${row?.id ?? "unknown"}`);
    if (
      !Array.isArray(row.stages) ||
      row.stages.length === 0 ||
      row.stages.some((stage) => !Number.isSafeInteger(stage) || stage < 0 || stage > 15) ||
      !Array.isArray(row.drivers) ||
      row.drivers.length === 0 ||
      row.drivers.some((driver) => driver !== "pure" && driver !== "runtime")
    ) {
      throw new Error(`incomplete_manifest_row:${row.id}`);
    }
    if (row.fixture !== null) {
      if (!safeReference(row.fixture)) throw new Error(`unsafe_fixture_reference:${row.id}`);
      const fixture = readJson(join(fixtureDirectory, row.fixture), 1024 * 1024);
      if (!Array.isArray(fixture.scenarioIds) || !fixture.scenarioIds.includes(row.id)) {
        throw new Error(`fixture_identity_mismatch:${row.id}`);
      }
      if (fixture.evidenceKind !== "runtime" || fixture.driver !== "runtime") {
        throw new Error(`fixture_not_runtime_evidence:${row.id}`);
      }
      validateRuntimeFixture(fixture, row.id);
    }
    if (
      row.runtimeSupport !== undefined &&
      (row.runtimeSupport.status !== "deferred_content" ||
        row.runtimeSupport.issue !== 822 ||
        typeof row.runtimeSupport.reason !== "string" ||
        row.runtimeSupport.reason.length === 0 ||
        row.fixture !== null ||
        !row.drivers.includes("runtime"))
    )
      throw new Error(`invalid_runtime_support:${row.id}`);
    if (row.authoredFixture !== undefined) {
      if (!safeReference(row.authoredFixture)) throw new Error(`unsafe_authored_fixture_reference:${row.id}`);
      const fixture = readJson(join(fixtureDirectory, row.authoredFixture), 1024 * 1024);
      if (!Array.isArray(fixture.scenarioIds) || !fixture.scenarioIds.includes(row.id)) {
        throw new Error(`authored_fixture_identity_mismatch:${row.id}`);
      }
    }
    ids.add(row.id);
  }
}

export function fixtureReference(row) {
  return row.fixture ?? row.authoredFixture ?? null;
}

export function pureFixtureReference(row, fixtureDirectory) {
  return (
    row.authoredFixture ??
    (row.fixture && readJson(join(fixtureDirectory, row.fixture), 1024 * 1024).driver === "pure" ? row.fixture : null)
  );
}

export function runtimeFixtureReference(row) {
  return row.fixture;
}

function validateRuntimeFixture(fixture, scenarioId) {
  const recipe = fixture.recipe;
  const assertion = fixture.assertions?.[scenarioId];
  if (
    !recipe ||
    typeof recipe.mapLabel !== "string" ||
    !Number.isSafeInteger(recipe.aiPlayerNumber) ||
    recipe.aiPlayerNumber <= 0 ||
    !Number.isFinite(recipe.simulationTimeScale) ||
    recipe.simulationTimeScale <= 0 ||
    !Array.isArray(recipe.checkpointTicks) ||
    recipe.checkpointTicks.length < 2 ||
    recipe.checkpointTicks.some((tick) => !Number.isSafeInteger(tick) || tick < 0) ||
    recipe.checkpointTicks.some((tick, index) => index > 0 && tick <= recipe.checkpointTicks[index - 1]) ||
    !Array.isArray(recipe.variants) ||
    recipe.variants.length === 0 ||
    new Set(recipe.variants.map((variant) => variant.id)).size !== recipe.variants.length ||
    recipe.variants.some(
      (variant) =>
        !variant ||
        typeof variant.id !== "string" ||
        variant.id.length === 0 ||
        (variant.scenarioIds !== undefined &&
          (!Array.isArray(variant.scenarioIds) ||
            variant.scenarioIds.length === 0 ||
            variant.scenarioIds.some((id) => !fixture.scenarioIds.includes(id)))) ||
        !Number.isSafeInteger(variant.seed) ||
        variant.seed < 0 ||
        !["Tivara", "Skaduwee"].includes(variant.aiFaction) ||
        !["Tivara", "Skaduwee"].includes(variant.humanFaction) ||
        !["Easy", "Normal", "Hard"].includes(variant.difficulty) ||
        (variant.supplyBranch !== undefined && !["prebuild", "ample_control"].includes(variant.supplyBranch)) ||
        (variant.pressureBranch !== undefined && !["raid", "safe_control"].includes(variant.pressureBranch)) ||
        (variant.resourceServiceBranch !== undefined &&
          !["build", "served_control"].includes(variant.resourceServiceBranch)) ||
        (variant.productionCapacityBranch !== undefined &&
          !["build", "already_sufficient"].includes(variant.productionCapacityBranch)) ||
        (variant.mapLabel !== undefined && typeof variant.mapLabel !== "string") ||
        (variant.perturbations !== undefined &&
          (!Array.isArray(variant.perturbations) ||
            variant.perturbations.some(
              (perturbation) =>
                !perturbation ||
                typeof perturbation.id !== "string" ||
                !Number.isSafeInteger(perturbation.tick) ||
                perturbation.tick < 0 ||
                perturbation.kind !== "human_attack_ai_home" ||
                !Number.isSafeInteger(perturbation.maximumAttackers) ||
                perturbation.maximumAttackers <= 0
            )))
    ) ||
    !assertion ||
    !Number.isSafeInteger(assertion.minimumDecisions) ||
    assertion.minimumDecisions <= 0 ||
    !Number.isSafeInteger(assertion.minimumAppliedCommands) ||
    assertion.minimumAppliedCommands <= 0 ||
    (assertion.requiredOpeningSteps !== undefined &&
      (!Array.isArray(assertion.requiredOpeningSteps) || assertion.requiredOpeningSteps.length === 0)) ||
    (assertion.requireNoInitialWorker !== undefined && typeof assertion.requireNoInitialWorker !== "boolean") ||
    (assertion.requireDeliveredIncome !== undefined && typeof assertion.requireDeliveredIncome !== "boolean") ||
    (assertion.requiredGroundRouteVariantIds !== undefined &&
      (!Array.isArray(assertion.requiredGroundRouteVariantIds) ||
        assertion.requiredGroundRouteVariantIds.some((variantId) => typeof variantId !== "string"))) ||
    !Array.isArray(assertion.requiredAiFactions) ||
    assertion.requiredAiFactions.length === 0 ||
    assertion.requiredAiFactions.some((faction) => !["Tivara", "Skaduwee"].includes(faction)) ||
    (assertion.requiredProductionCapacity !== undefined &&
      !validProductionCapacityPair(recipe, assertion, scenarioId)) ||
    (assertion.requireSupplyControl === true &&
      !["prebuild", "ample_control"].every((branch) =>
        recipe.variants.some(
          (variant) =>
            variant.supplyBranch === branch &&
            (variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
        )
      )) ||
    (assertion.requirePressureResponse !== undefined && typeof assertion.requirePressureResponse !== "boolean") ||
    (assertion.requirePressureResponse === true &&
      !["raid", "safe_control"].every((branch) =>
        recipe.variants.some(
          (variant) =>
            variant.pressureBranch === branch &&
            (variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
        )
      )) ||
    (assertion.requiredResourceService !== undefined &&
      (!assertion.requiredResourceService ||
        typeof assertion.requiredResourceService.sourceObjectName !== "string" ||
        typeof assertion.requiredResourceService.serviceObjectName !== "string" ||
        typeof assertion.requiredResourceService.resourceType !== "string" ||
        !Number.isSafeInteger(assertion.requiredResourceService.maximumTileDistance) ||
        assertion.requiredResourceService.maximumTileDistance <= 0 ||
        !Number.isSafeInteger(assertion.requiredResourceService.latestTick) ||
        assertion.requiredResourceService.latestTick <= 0 ||
        !["build", "served_control"].every((branch) =>
          recipe.variants.some(
            (variant) =>
              variant.resourceServiceBranch === branch &&
              (variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
          )
        ))) ||
    (assertion.requiredSaturatedSource !== undefined &&
      (!assertion.requiredSaturatedSource ||
        typeof assertion.requiredSaturatedSource.saturatedFixtureActorId !== "string" ||
        typeof assertion.requiredSaturatedSource.spareFixtureActorId !== "string" ||
        typeof assertion.requiredSaturatedSource.resourceType !== "string" ||
        !Number.isSafeInteger(assertion.requiredSaturatedSource.capacity) ||
        assertion.requiredSaturatedSource.capacity < 1 ||
        !Number.isSafeInteger(assertion.requiredSaturatedSource.latestTick) ||
        assertion.requiredSaturatedSource.latestTick < 1 ||
        !recipe.variants.some((variant) => {
          if (variant.scenarioIds !== undefined && !variant.scenarioIds.includes(scenarioId)) return false;
          const preset = variant.presetWorld;
          const fullId = assertion.requiredSaturatedSource.saturatedFixtureActorId;
          const spareId = assertion.requiredSaturatedSource.spareFixtureActorId;
          return (
            preset?.actors?.some((actor) => actor.fixtureActorId === fullId && actor.owner === null) &&
            preset.actors.some((actor) => actor.fixtureActorId === spareId && actor.owner === null) &&
            preset.initialOrders?.filter((order) => order.sourceFixtureActorId === fullId).length ===
              assertion.requiredSaturatedSource.capacity
          );
        }))) ||
    (assertion.requiredResourceLabor !== undefined &&
      (!assertion.requiredResourceLabor ||
        assertion.requiredResourceLabor.playerNumber !== recipe.aiPlayerNumber ||
        !["food", "wood", "stone", "minerals"].includes(assertion.requiredResourceLabor.resourceType) ||
        !Number.isSafeInteger(assertion.requiredResourceLabor.latestTick) ||
        assertion.requiredResourceLabor.latestTick < 1 ||
        assertion.requiredResourceLabor.latestTick > recipe.checkpointTicks.at(-1) ||
        !recipe.variants.some(
          (variant) => variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId)
        ) ||
        !recipe.variants.every((variant) => {
          if (variant.scenarioIds !== undefined && !variant.scenarioIds.includes(scenarioId)) return true;
          const preset = variant.presetWorld;
          return (
            preset?.initialOrders?.length === 0 &&
            preset.resourceStarts?.length === 1 &&
            preset.resourceStarts[0]?.amounts?.[assertion.requiredResourceLabor.resourceType] === 0
          );
        }))) ||
    (assertion.requiredWorkerGrowth !== undefined &&
      (!assertion.requiredWorkerGrowth ||
        typeof assertion.requiredWorkerGrowth.variantId !== "string" ||
        !recipe.variants.some(
          (variant) =>
            variant.id === assertion.requiredWorkerGrowth.variantId &&
            (variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId)) &&
            variant.presetWorld?.resourceStarts?.length === 1
        ) ||
        !Number.isSafeInteger(assertion.requiredWorkerGrowth.initialWorkerCount) ||
        assertion.requiredWorkerGrowth.initialWorkerCount < 1 ||
        !Number.isSafeInteger(assertion.requiredWorkerGrowth.minimumPeakWorkerCount) ||
        assertion.requiredWorkerGrowth.minimumPeakWorkerCount <= assertion.requiredWorkerGrowth.initialWorkerCount ||
        !Number.isSafeInteger(assertion.requiredWorkerGrowth.minimumFinalWorkerCount) ||
        assertion.requiredWorkerGrowth.minimumFinalWorkerCount <= assertion.requiredWorkerGrowth.initialWorkerCount ||
        !Number.isSafeInteger(assertion.requiredWorkerGrowth.latestTick) ||
        assertion.requiredWorkerGrowth.latestTick < 1)) ||
    [
      "maximumTick",
      "minimumMilitaryCount",
      "minimumMilitaryTypeCount",
      "minimumRepeatedMilitaryTypeCount",
      "minimumMilitaryProducerCount",
      "maximumMilitaryProducerCount",
      "maximumQueueOccupancyPerProducer",
      "firstOffensiveLaunchByTick",
      "minimumOffensiveLaunchCount",
      "minimumDamageDealt",
      "minimumEnemyLosses"
    ].some(
      (field) => assertion[field] !== undefined && (!Number.isSafeInteger(assertion[field]) || assertion[field] < 0)
    ) ||
    [
      "requireCompositionDemand",
      "requireCapacityDemand",
      "requireProductionStopsAtTarget",
      "requireMissionContinuation",
      "requireAiVictory",
      "requireRaidDefenseRecovery",
      "requireSupplyControl"
    ].some((field) => assertion[field] !== undefined && typeof assertion[field] !== "boolean")
  ) {
    throw new Error(`malformed_runtime_fixture:${scenarioId}`);
  }
  validateRuntimeRecipeMetadata(recipe);
  validateEvidenceStopAssertions(fixture);
}

export function safeReference(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 512 &&
    !value.startsWith("/") &&
    !value.includes("..") &&
    !value.includes("\\") &&
    !value.includes(":")
  );
}
