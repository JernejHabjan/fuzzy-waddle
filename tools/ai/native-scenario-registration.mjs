import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { nativeScenarioWorld } from "./native-scenario-worlds.mjs";
import { nativeDomainWorld } from "./native-domain-worlds.mjs";
import { nativeStrategicWorld } from "./native-strategic-worlds.mjs";
import { nativeClassicWorld } from "./native-classic-worlds.mjs";
import { nativeRecoveryWorld } from "./native-recovery-worlds.mjs";
import { nativeAuthorityWorld } from "./native-authority-worlds.mjs";
import { nativeDifficultyWorld } from "./native-difficulty-worlds.mjs";
import { nativeDifficultyFairnessWorld } from "./native-difficulty-fairness-worlds.mjs";
import { nativeEasyContinuityWorld } from "./native-easy-continuity-worlds.mjs";
import { nativeTopologyChurnWorld } from "./native-topology-churn-worlds.mjs";
import { nativeDifficultyPressureWorld } from "./native-difficulty-pressure-worlds.mjs";
import { nativeContinuityWorld } from "./native-continuity-worlds.mjs";
import { nativeOptionalReleaseWorld } from "./native-optional-release-worlds.mjs";
import { nativeDebugParityWorld } from "./native-debug-parity-worlds.mjs";
import { nativeIslandEstablishmentWorld } from "./native-island-establishment-worlds.mjs";
import { nativeLifecycleWorld } from "./native-lifecycle-worlds.mjs";
import { nativeSaveWorld } from "./native-save-worlds.mjs";
import { nativeLifecycleSequenceWorld } from "./native-lifecycle-sequence-worlds.mjs";

export const nativeScenarioBindings = JSON.parse(readFileSync(new URL("./native-scenario-bindings.json", import.meta.url), "utf8"));
const expansion = JSON.parse(readFileSync(new URL("./fixtures/expansion-pressure-runtime.json", import.meta.url), "utf8"));

/** Missing faction capabilities are explicit branch bindings, not fictional casters or silently skipped test assertions. */
export function nativeScenarioBranches(id, faction) {
  const explicit = nativeScenarioBindings.cases[id].branchesByFaction?.[faction];
  if (explicit) return explicit;
  return nativeScenarioBindings.cases[id].branches.filter((branch) =>
    !(id === "FIGHT-04" && (branch === "zone" && faction !== "Tivara" || branch === "support_expiry" && faction !== "Skaduwee")) &&
    !(id === "FIGHT-05" && (branch === "stun" && faction !== "Tivara" || branch === "slow" && faction !== "Skaduwee")));
}

/** Author concrete JSON for the ordinary runtime driver. This function never starts Phaser or evaluates a scenario. */
export function nativeScenarioFixture(id) {
  const binding = nativeScenarioBindings.cases[id];
  if (!binding) throw new Error(`native_scenario_unknown:${id}`);
  const ticks = (binding.checkpointTicks ?? [20, 100, 199, 200, 399, 400, 600, 800, 1000, 1200, 1600, 2000, 2400, 3000, 4000])
    .filter((tick) => tick > 0)
    .filter((tick) => tick <= binding.latestTick);
  const branches = {};
  const variants = ["Tivara", "Skaduwee"].flatMap((faction) => nativeScenarioBranches(id, faction).map((branch) => {
    const recovery = ["H-01", "H-02", "H-03", "H-04", "H-19", "H-24", "H-25", "H-26"].includes(id);
    const authority = ["H-06", "H-07", "H-10", "H-13", "H-14", "H-15", "H-11", "H-12", "H-30"].includes(id);
    const world = ["DBG-01", "DBG-03"].includes(id) ? nativeSaveWorld(faction, "during_active") :
      id === "SEQ-08" ? nativeLifecycleSequenceWorld(faction, branch) :
      ["H-08", "H-09"].includes(id) ? lateAuthorityWorld(faction) :
      id === "D-02" ? nativeSaveWorld(faction, branch.endsWith("pending_plan") ? "applied_pending" : "before_apply") :
      id === "H-31" ? nativeSaveWorld(faction, branch) : id === "H-32" ? nativeLifecycleWorld(faction, branch) :
      id === "H-23" ? nativeIslandEstablishmentWorld(faction, branch) :
      id === "DBG-06" ? nativeDebugParityWorld(faction) :
      id === "H-05" ? nativeOptionalReleaseWorld(faction, branch) :
      ["SEQ-03", "SEQ-04", "SEQ-06", "SEQ-07"].includes(id) ? nativeContinuityWorld(id, faction, branch) :
      id === "D-05" ? nativeDifficultyPressureWorld(faction, branch) :
      id === "H-20" ? nativeTopologyChurnWorld(faction, branch) :
      id === "D-04" ? nativeEasyContinuityWorld(faction, branch) :
      id === "D-03" ? nativeDifficultyFairnessWorld(faction, branch) :
      ["D-01", "DBG-04", "DBG-05"].includes(id) ? nativeDifficultyWorld(faction, branch) :
      authority ? nativeAuthorityWorld(id, faction, branch) : recovery ? nativeRecoveryWorld(id, faction, branch) :
      id === "EXP-01" ? expansionWorld(faction, branch) : id.startsWith("DOMAIN-") ?
      nativeDomainWorld(id, faction, branch) : id.startsWith("C-") ? nativeClassicWorld(id, faction, branch) :
      ["STRAT-02", "STRAT-03", "STRAT-08", "STRAT-09", "RAID-03"].includes(id) ?
        nativeStrategicWorld(id, faction, branch) : nativeScenarioWorld(id, faction, branch);
    if (id === "H-28") {
      const inherited = structuredClone(expansion.recipe.variants[0].presetWorld.existingActorBindings
        .filter((actor) => actor.owner === null));
      world.existingActorBindings.push(...inherited);
      world.sourceStocks = [...inherited, ...world.actors.filter((actor) => actor.owner === null)]
        .map((actor) => ({ fixtureActorId: actor.fixtureActorId, amount: 0 }));
    }
    if (id === "STRAT-09" && branch === "unrecoverable") {
      const inherited = structuredClone(expansion.recipe.variants[0].presetWorld.existingActorBindings
        .filter((actor) => actor.owner === null));
      world.existingActorBindings.push(...inherited);
      world.sourceStocks = [...inherited, ...world.actors.filter((actor) => actor.owner === null)]
        .map((actor) => ({ fixtureActorId: actor.fixtureActorId, amount: 0 }));
    }
    const variantId = `${id.toLowerCase()}-${faction.toLowerCase()}-${branch.replaceAll("_", "-")}`;
    // Paired controls need identical stamped match/actor/command identities, not merely the same random seed.
    world.fixtureId = id === "DBG-06" ? `dbg-06-${faction.toLowerCase()}-parity` :
      ["H-06", "H-07"].includes(id) ? `${id.toLowerCase()}-${faction.toLowerCase()}-receipt-pair` : id === "D-03" ?
      `d-03-${faction.toLowerCase()}-${branch.split("_")[0]}` : id === "SCOUT-02" ?
      `scout-02-${faction.toLowerCase()}-withdrawal-pair` : variantId;
    branches[variantId] = branch;
    // An explicit route declaration requires at least one route; empty factory scratch arrays are not declarations.
    if (world.protectedRoutes?.length === 0) delete world.protectedRoutes;
    else if (world.protectedRoutes) world.protectedRoutes = world.protectedRoutes.map((route) => ({ ...route,
      from: { x: route.from.x, y: route.from.y }, to: { x: route.to.x, y: route.to.y }
    }));
    return {
      id: variantId, executionKind: "focused_preset",
      role: "standalone", seed: id === "D-06" ? 759061 : id === "EXP-01" ? 759933 : 759940,
      deadlineRationale: "Original scenario ceiling; native event-boundary capture supplements polling without extending the deadline.",
      aiFaction: faction, humanFaction: faction === "Tivara" ? "Skaduwee" : "Tivara",
      difficulty: id === "DBG-06" ? "Hard" : id === "D-04" ? "Easy" : ["D-01", "D-02", "D-03", "D-05"].includes(id) ?
        ({ easy: "Easy", normal: "Normal", hard: "Hard" })[branch.split("_")[0]] : "Normal",
      ...(id === "C-06" ? {
        additionalAiPlayers: [{ playerNumber: 3, faction: faction === "Tivara" ? "Skaduwee" : "Tivara", difficulty: "Easy" }],
        lobbyTeams: [{ playerNumber: 1, team: 1 }, { playerNumber: 2, team: branch === "allied_control" ? 1 : 2 },
          { playerNumber: 3, team: 3 }]
      } : {}),
      ...(id === "DOMAIN-02" && ["intercept", "escort"].includes(branch) ? {
        additionalAiPlayers: [{ playerNumber: 3, faction: "Tivara", difficulty: "Easy" }]
      } : {}),
      ...(id === "H-32" ? { requiresMultiplayer: branch === "host_replacement" } : {}),
      ...(["D-02", "D-06", "H-31", "H-32", "DBG-05"].includes(id) ? {} :
        { captureConstruction: true, captureCombat: true }), scenarioIds: [id],
      ...(id === "DBG-05" ? { checkpointTicks: [20] } : {}),
      ...(["DBG-01", "DBG-03"].includes(id) ? { captureConstruction: true, checkpointTicks: [599, 800] } : {}),
      ...(id === "D-02" ? { captureConstruction: true, checkpointTicks: [branch.endsWith("pending_plan") ? 199 :
        ({ easy: 39, normal: 19, hard: 9 })[branch.split("_")[0]], 400] } : {}),
      ...(id === "H-31" ? { captureConstruction: true,
        checkpointTicks: branch === "pause_speed" ? [599, 800] :
          [({ before_apply: 19, applied_pending: 199, during_active: 119 })[branch], 400] } : {}),
      ...(id === "SEQ-08" ? { captureConstruction: true, checkpointTicks: [
        ({ before_apply: 19, applied_pending: 199, during_active: 119, host_transfer: 19 })[branch], 400] } : {}),
      ...(id === "H-32" ? { checkpointTicks: ["paid_queue", "pending_path"].includes(branch) ? [20] : [20, 200] } : {}),
      ...(id === "H-32" && branch === "host_replacement" ? {
        executionKind: "focused_natural", mapLabel: "AI Multiplayer (test only)",
        setupRationale: "Actual two-human relay and host-owned AI3; this preset belongs only to the subsequent native AI2 match.",
        nextMatchPresetWorld: world
      } : id === "D-06" ? { executionKind: "focused_natural", mapLabel: "River Crossing",
        setupRationale: "Dispatch group for the frozen multi-map legal-start calibration driver; no actor/resource preset." } :
        { presetWorld: world })
    };
  }));
  return {
    schemaVersion: 1, evidenceKind: "runtime", driver: "runtime", scenarioIds: [id], status: "authored_not_executed",
    purpose: binding.acceptance?.requiredOutcome ?? id,
    acceptance: binding.acceptance,
    ...(binding.capabilityLimits ? { capabilityLimits: id === "D-06" ? [...binding.capabilityLimits,
      `Frozen workload specification sha256:${createHash("sha256").update(readFileSync(
        new URL("./fixtures/difficulty-calibration-v1.json", import.meta.url))).digest("hex")}`] : binding.capabilityLimits } : {}),
    recipe: { mapLabel: id === "D-06" ? "River Crossing" :
      ["C-06", "DOMAIN-02"].includes(id) ? "AI Multiplayer (test only)" : "AI Open Economy (test only)",
      aiPlayerNumber: 2, simulationTimeScale: 1,
      ...(["D-02", "H-08", "H-09", "H-32", "SEQ-08", "DBG-03", "DBG-05"].includes(id) ? { requiresMultiplayer: true } : {}),
      fixedStepFrames: true, checkpointTicks: ticks, variants },
    assertions: { [id]: { maximumTick: binding.latestTick, minimumDecisions: 1,
      // Infeasible controls need no arbitrary command. Feasible branches separately require native paid work and delivery.
      minimumAppliedCommands: ["STRAT-09", "H-11"].includes(id) ? 0 : 1,
      ...(id === "STRAT-08" ? { requireAiVictory: true } : {}),
      requiredAiFactions: ["Tivara", "Skaduwee"], requiredNativeScenario: {
        schemaVersion: 1, scenarioId: id, latestTick: binding.latestTick, humanPlayerNumber: 1, branchByVariant: branches
      } } }
  };
}

/** Native consumer uncertainty precedes a real cancellation or independent two-client host fence. */
function lateAuthorityWorld(faction) {
  const world = nativeAuthorityWorld("H-06", faction, "late");
  world.receiptFault.holdHistory = true;
  world.receiptFault.throughTick = 1800;
  return world;
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
