import { readFileSync } from "node:fs";
import { nativeScenarioWorld } from "./native-scenario-worlds.mjs";

export const nativeScenarioBindings = JSON.parse(readFileSync(new URL("./native-scenario-bindings.json", import.meta.url), "utf8"));
const expansion = JSON.parse(readFileSync(new URL("./fixtures/expansion-pressure-runtime.json", import.meta.url), "utf8"));

/** Missing faction capabilities are explicit branch bindings, not fictional casters or silently skipped test assertions. */
export function nativeScenarioBranches(id, faction) {
  return nativeScenarioBindings.cases[id].branches.filter((branch) =>
    !(id === "FIGHT-04" && (branch === "zone" && faction !== "Tivara" || branch === "support_expiry" && faction !== "Skaduwee")) &&
    !(id === "FIGHT-05" && (branch === "stun" && faction !== "Tivara" || branch === "slow" && faction !== "Skaduwee")));
}

/** Author concrete JSON for the ordinary runtime driver. This function never starts Phaser or evaluates a scenario. */
export function nativeScenarioFixture(id) {
  const binding = nativeScenarioBindings.cases[id];
  if (!binding) throw new Error(`native_scenario_unknown:${id}`);
  const ticks = [20, 100, 199, 200, 399, 400, 600, 800, 1000, 1200, 1600, 2000, 2400, 3000, 4000]
    .filter((tick) => tick <= binding.latestTick);
  const branches = {};
  const variants = ["Tivara", "Skaduwee"].flatMap((faction) => nativeScenarioBranches(id, faction).map((branch) => {
    const world = id === "EXP-01" ? expansionWorld(faction, branch) : nativeScenarioWorld(id, faction, branch);
    if (id === "H-28") {
      const inherited = structuredClone(expansion.recipe.variants[0].presetWorld.existingActorBindings
        .filter((actor) => actor.owner === null));
      world.existingActorBindings.push(...inherited);
      world.sourceStocks = [...inherited, ...world.actors.filter((actor) => actor.owner === null)]
        .map((actor) => ({ fixtureActorId: actor.fixtureActorId, amount: 0 }));
    }
    const variantId = `${id.toLowerCase()}-${faction.toLowerCase()}-${branch.replaceAll("_", "-")}`;
    world.fixtureId = variantId;
    branches[variantId] = branch;
    return {
      id: variantId, executionKind: "focused_preset", role: "standalone", seed: id === "EXP-01" ? 759933 : 759940,
      deadlineRationale: "Original scenario ceiling; native event-boundary capture supplements polling without extending the deadline.",
      aiFaction: faction, humanFaction: faction === "Tivara" ? "Skaduwee" : "Tivara", difficulty: "Normal",
      captureConstruction: true, captureCombat: true, scenarioIds: [id], presetWorld: world
    };
  }));
  return {
    schemaVersion: 1, evidenceKind: "runtime", driver: "runtime", scenarioIds: [id], status: "authored_not_executed",
    purpose: binding.acceptance?.requiredOutcome ?? id,
    acceptance: binding.acceptance,
    recipe: { mapLabel: "AI Open Economy (test only)", aiPlayerNumber: 2, simulationTimeScale: 1,
      fixedStepFrames: true, checkpointTicks: ticks, variants },
    assertions: { [id]: { maximumTick: binding.latestTick, minimumDecisions: 1, minimumAppliedCommands: 1,
      requiredAiFactions: ["Tivara", "Skaduwee"], requiredNativeScenario: {
        schemaVersion: 1, scenarioId: id, latestTick: binding.latestTick, humanPlayerNumber: 1, branchByVariant: branches
      } } }
  };
}

/** Existing expansion owner geometry is retained, including original resource identities and legitimate threat exposure. */
function expansionWorld(faction, branch) {
  const original = expansion.recipe.variants.find((variant) => variant.aiFaction === faction &&
    expansion.assertions["EXP-02"].requiredExpansionPressure.branchByVariant[variant.id] === "expand");
  const world = structuredClone(original.presetWorld);
  if (branch === "served") world.actors.push({ fixtureActorId: "existing-expansion", actorName: "WorkMill", owner: 2,
    position: { x: -64, y: 1264, z: 0 } });
  if (branch === "busy_worker") world.initialOrders = [{ workerFixtureActorId: "expansion-worker-0",
    sourceFixtureActorId: "safe-source", kind: "gather" }];
  return world;
}
