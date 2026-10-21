import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { nativeScenarioBindings, nativeScenarioFixture } from "./native-scenario-registration.mjs";
import { validNativeScenarioFixture } from "./skirmish-runtime-native-scenario-fixture.mjs";

test("all native bindings retain their full branches and original acceptance obligations", () => {
  const ids = Object.keys(nativeScenarioBindings.cases);
  assert.equal(ids.length, 80);
  const manifest = JSON.parse(readFileSync(new URL("./fixtures/skirmish-v1.json", import.meta.url)));
  for (const id of ids) {
    const row = manifest.rows.find((row) => row.id === id);
    assert.equal(row.fixture, `${id.toLowerCase()}-native-runtime.json`);
    assert.equal(row.runtimeRecipeDraft, undefined);
    const fixture = JSON.parse(readFileSync(new URL(`./fixtures/${row.fixture}`, import.meta.url)));
    assert.equal(validNativeScenarioFixture(fixture, id), true);
    assert.ok(fixture.acceptance.required.length > 0);
    assert.ok(fixture.acceptance.forbidden.length > 0);
    assert.equal(fixture.status, "authored_not_executed");
  }
});

test("D-03 preserves every difficulty/hidden mutation and the legitimate-contact control", () => {
  const fixture = nativeScenarioFixture("D-03"), contract = fixture.assertions["D-03"].requiredNativeScenario;
  assert.equal(fixture.recipe.variants.length, 30);
  for (const [mutation, mutate] of [
    ["position", (v) => v.presetWorld.controls = []],
    ["health", (v) => v.presetWorld.events = []],
    ["queue", (v) => v.presetWorld.controls = []],
    ["contact", (v) => v.presetWorld.controls[0].action.worldPosition.x = 0]
  ]) {
    const copy = structuredClone(fixture);
    const variant = copy.recipe.variants.find((v) => contract.branchByVariant[v.id] === `easy_${mutation}`);
    assert.ok(variant);
    mutate(variant);
    assert.equal(validNativeScenarioFixture(copy, "D-03"), false);
  }
});

test("continuous, optional-release, topology and debug bindings retain their causal controls", () => {
  for (const [id, branch, mutate] of [
    ["H-05", "uncertain", (world) => delete world.receiptFault.holdHistory],
    ["H-05", "paid", (world) => world.queues = []],
    ["H-20", "dispose", (world) => world.routeOutages.pop()],
    ["H-23", "builder_late", (world) => world.routeOutages[0].membership = "optional_passenger"],
    ["H-23", "optional_lost", (world) => world.events = []],
    ["H-23", "optional_late", (world) => world.terrainPatches = []],
    ["SEQ-03", "congested", (world) => world.initialOrders = []],
    ["SEQ-04", "cancel_race", (world) => world.researchQueues = []],
    ["SEQ-06", "stair", (world) => world.events = []],
    ["SEQ-07", "alternate", (world) => world.terrainPatches = []],
    ["D-04", "opening_counter_retreat_recovery", (world) => world.events = []],
    ["D-05", "hard", (world) => world.controls = []],
    ["DBG-06", "quota", (world) => delete world.receiptFault.holdHistory]
  ]) {
    const fixture = nativeScenarioFixture(id), contract = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((value) => contract.branchByVariant[value.id] === branch);
    assert.ok(variant, `${id}:${branch}`);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
  for (const id of ["D-03", "DBG-06"]) {
    const fixture = nativeScenarioFixture(id), contract = fixture.assertions[id].requiredNativeScenario;
    const pair = fixture.recipe.variants.filter((variant) => variant.aiFaction === "Tivara" &&
      (id !== "D-03" || contract.branchByVariant[variant.id].startsWith("easy_")));
    assert.equal(new Set(pair.map((variant) => variant.presetWorld.fixtureId)).size, 1);
  }
});

test("authority and priority bindings reject erased consumer faults and altered native premises", () => {
  for (const [id, branch, mutate] of [
    ["H-12", "permuted", (world) => world.proposalOrder = "forward"],
    ["H-12", "paid_neighbor", (world) => world.constructionOrders = []],
    ["H-11", "infeasible", (world) => world.sourceStocks = []],
    ["H-11", "bootstrap", (world) => delete world.recoveryStart],
    ["H-30", "debug", (world) => delete world.brainFault],
    ["H-30", "mandatory", (world) => world.brainFault.kind = "throw"],
    ["H-06", "rejected", (world) => delete world.receiptFault.contendQueue],
    ["H-07", "destroyed", (world) => delete world.receiptFault.destroyOutput],
    ["H-10", "below_capacity", (world) => world.receiptFault.maximumCommands++],
    ["H-10", "resumed", (world) => world.receiptFault.throughTick++],
    ["H-13", "new_identity", (world) => world.controls = []],
    ["H-13", "essential", (world) => world.events = []],
    ["H-14", "harmless", (world) => world.controls = []],
    ["H-15", "lethal", (world) => delete world.receiptFault.holdHistory],
    ["H-15", "resolved", (world) => world.controls = world.controls.filter((control) => control.applicationTick < 1000)]
  ]) {
    const fixture = nativeScenarioFixture(id), contract = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((value) => contract.branchByVariant[value.id] === branch);
    assert.ok(variant);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
});

test("D-01 binds each actual lobby policy in both factions and rejects a relabelled Normal fallback", () => {
  const fixture = nativeScenarioFixture("D-01"), contract = fixture.assertions["D-01"].requiredNativeScenario;
  assert.equal(fixture.recipe.variants.length, 6);
  for (const faction of ["Tivara", "Skaduwee"]) for (const [branch, difficulty] of
    [["easy", "Easy"], ["normal", "Normal"], ["hard", "Hard"]]) {
    const variant = fixture.recipe.variants.find((value) => value.aiFaction === faction &&
      contract.branchByVariant[value.id] === branch);
    assert.ok(variant);
    assert.equal(variant.difficulty, difficulty);
    assert.equal(variant.presetWorld.resourceGrants.length, 0);
  }
  fixture.recipe.variants[0].difficulty = "Normal";
  assert.equal(validNativeScenarioFixture(fixture, "D-01"), false);
});

test("remaining continuous/replay/calibration bindings stay explicit until their real drivers are connected", () => {
  const drafts = JSON.parse(readFileSync(new URL("./fixtures/native-scenario-recipes.json", import.meta.url)));
  for (const id of drafts.scenarioIds) {
    assert.equal(Object.hasOwn(nativeScenarioBindings.cases, id), false);
    const entry = drafts.cases.find((value) => value.scenarioId === id);
    assert.ok(entry.executionBlockers.includes("native_case_binding"));
  }
});

test("H-09 retains real compaction, SP codec restore and independent peer acknowledgment branches", () => {
  const fixture = nativeScenarioFixture("H-09");
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 6);
  assert.ok(fixture.recipe.checkpointTicks.includes(20));
  assert.ok(fixture.recipe.checkpointTicks.includes(199));
  assert.equal(fixture.assertions["H-09"].requiredNativeScenario.latestTick, 2400);
  for (const variant of fixture.recipe.variants) {
    assert.equal(variant.captureConstruction, true);
    assert.equal(variant.captureCombat, true);
    assert.equal(variant.presetWorld.receiptFault.holdHistory, true);
  }
});

test("H-08 retains original timeout/cancel boundaries and both real old-epoch delivery orders", () => {
  const fixture = nativeScenarioFixture("H-08");
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 8);
  assert.ok(fixture.recipe.checkpointTicks.includes(199));
  assert.ok(fixture.recipe.checkpointTicks.includes(1801));
  for (const variant of fixture.recipe.variants) {
    assert.equal(variant.presetWorld.receiptFault.holdHistory, true);
    assert.equal(variant.presetWorld.receiptFault.throughTick, 1800);
    assert.equal(variant.presetWorld.receiptFault.maximumCommands, 1);
  }
});

test("H-31 binds autonomous single-player codec continuation without unsupported queues or future external inputs", () => {
  const fixture = nativeScenarioFixture("H-31"), branches = fixture.assertions["H-31"].requiredNativeScenario.branchByVariant;
  assert.equal(fixture.recipe.variants.length, 8);
  assert.equal(fixture.recipe.requiresMultiplayer, undefined);
  for (const variant of fixture.recipe.variants) {
    const world = variant.presetWorld, branch = branches[variant.id];
    assert.equal(world.events.length, 0);
    assert.equal(world.controls.length, 0);
    assert.equal(world.routeOutages.length, 0);
    assert.equal(variant.captureConstruction, true);
    assert.equal(variant.captureCombat, undefined);
    assert.ok(variant.checkpointTicks[0] < variant.checkpointTicks[1]);
    if (branch === "during_active") {
      assert.equal(world.queues[0].count, 4);
      assert.equal(world.researchQueues.length, 1);
      assert.equal(world.constructionOrders.length, 1);
    }
    if (branch === "applied_pending") assert.equal(world.receiptFault.throughTick, variant.checkpointTicks[0]);
  }
});

test("D-02 retains all selected policies and independent real multiplayer checkpoint transfer", () => {
  const fixture = nativeScenarioFixture("D-02"), branches = fixture.assertions["D-02"].requiredNativeScenario.branchByVariant;
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 18);
  for (const variant of fixture.recipe.variants) {
    const branch = branches[variant.id], pending = branch.endsWith("pending_plan");
    assert.equal(variant.checkpointTicks[0], pending ? 199 : { Easy: 39, Normal: 19, Hard: 9 }[variant.difficulty]);
    assert.equal(variant.captureCombat, undefined);
    assert.equal(variant.presetWorld.receiptFault?.holdHistory, pending ? true : undefined);
  }
  const withoutRealPeers = structuredClone(fixture);
  delete withoutRealPeers.recipe.requiresMultiplayer;
  assert.equal(validNativeScenarioFixture(withoutRealPeers, "D-02"), false);
});

test("native cases cannot downgrade to generic counts or omit a faction, branch or physical channel", () => {
  for (const id of Object.keys(nativeScenarioBindings.cases)) for (const mutate of [
    (value) => delete value.assertions[id].requiredNativeScenario,
    (value) => value.recipe.variants.pop(),
    (value) => value.recipe.variants[0].captureCombat = ["D-02", "H-31", "H-32", "DBG-05"].includes(id) ? true : undefined,
    (value) => value.recipe.variants[0].captureConstruction = ["H-32", "DBG-05"].includes(id) ? true : undefined,
    (value) => value.recipe.variants[0].evidenceStop = { earliestTick: 20, stableForTicks: 0 },
    (value) => value.recipe.variants[0].seed++,
    (value) => value.recipe.variants[0].presetWorld.resourceStarts[0].amounts.wood++,
    (value) => value.assertions[id].requiredNativeScenario.branchByVariant.invented = "quiet"
  ]) {
    const fixture = nativeScenarioFixture(id);
    mutate(fixture);
    assert.equal(validNativeScenarioFixture(fixture, id), false, id);
  }
});

test("H-32 binds real relay promotion, one retained realm and independent pending path/paid-work controls", () => {
  const fixture = nativeScenarioFixture("H-32");
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 8);
  for (const faction of ["Tivara", "Skaduwee"]) {
    const host = fixture.recipe.variants.find((variant) => variant.aiFaction === faction &&
      fixture.assertions["H-32"].requiredNativeScenario.branchByVariant[variant.id] === "host_replacement");
    assert.equal(host.presetWorld, undefined);
    assert.equal(host.executionKind, "focused_natural");
    assert.ok(host.nextMatchPresetWorld);
  }
  for (const mutate of [
    (value) => delete value.recipe.requiresMultiplayer,
    (value) => value.recipe.variants.find((variant) => variant.nextMatchPresetWorld).presetWorld = {},
    (value) => delete value.recipe.variants.find((variant) => variant.nextMatchPresetWorld).nextMatchPresetWorld,
    (value) => value.recipe.variants.find((variant) => variant.id.endsWith("paid-queue")).checkpointTicks = [4000],
    (value) => value.recipe.variants.find((variant) => variant.id.endsWith("pending-path")).presetWorld.routeOutages = []
  ]) {
    const changed = structuredClone(fixture);
    mutate(changed);
    assert.equal(validNativeScenarioFixture(changed, "H-32"), false);
  }
});

test("DBG-05 retains every hostile import branch and real-peer authorization requirement", () => {
  const fixture = nativeScenarioFixture("DBG-05");
  assert.equal(fixture.recipe.variants.length, 12);
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.deepEqual(nativeScenarioBindings.cases["DBG-05"].branches,
    ["malformed", "oversized", "version_mismatch", "traversal", "html", "unauthorized_peer"]);
  assert.ok(fixture.recipe.variants.every((variant) => variant.checkpointTicks[0] === 20 && !variant.captureConstruction));
  delete fixture.recipe.requiresMultiplayer;
  assert.equal(validNativeScenarioFixture(fixture, "DBG-05"), false);
});

test("source-controlled worlds reject erased perturbations, fake observations and altered topology", () => {
  for (const [id, branch, mutate] of [
    ["SCOUT-02", "hidden_health", (world) => world.events = []],
    ["SCOUT-02", "hidden_queue", (world) => world.controls = []],
    ["WALL-01", "terrain", (world) => world.terrainPatches = []],
    ["FIGHT-05", "stun", (world) => world.researchQueues = []],
    ["FIGHT-04", "healing", (world) => world.healthStarts = []],
    ["STRAT-10", "combined_loss", (world) => world.events = []],
    ["STRAT-07", "breach", (world) => world.events = []],
    ["H-28", "prefix", (world) => world.sourceStocks = []]
  ]) {
    const fixture = nativeScenarioFixture(id), binding = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((variant) => binding.branchByVariant[variant.id] === branch);
    assert.ok(variant);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
});

test("capability-specific spell branches never invent the other faction's caster", () => {
  const fight = nativeScenarioFixture("FIGHT-05"), binding = fight.assertions["FIGHT-05"].requiredNativeScenario;
  for (const variant of fight.recipe.variants) {
    const branch = binding.branchByVariant[variant.id];
    if (branch === "stun") assert.equal(variant.humanFaction, "Skaduwee");
    if (branch === "slow") assert.equal(variant.humanFaction, "Tivara");
  }
});

test("mission bindings cannot erase native transport, outages, team controls or the terminal horizon", () => {
  for (const [id, branch, mutate] of [
    ["RAID-03", "boat_raid", (v) => v.presetWorld.controls = []],
    ["STRAT-09", "path_outage", (v) => delete v.presetWorld.routeOutages],
    ["C-06", "defeated", (v) => delete v.additionalAiPlayers],
    ["C-06", "allied_control", (v) => v.lobbyTeams = []],
    ["DOMAIN-02", "intercept", (v) => v.presetWorld.actors.find((a) => a.fixtureActorId === "contact-group").owner = 1],
    ["STRAT-08", "exposed", (v) => v.checkpointTicks = [20, 4000]]
  ]) {
    const fixture = nativeScenarioFixture(id), contract = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((v) => contract.branchByVariant[v.id] === branch);
    assert.ok(variant);
    mutate(variant);
    assert.equal(validNativeScenarioFixture(fixture, id), false, id);
  }
});

test("unsupported naval and diplomacy content is explicit rather than silently invented", () => {
  const naval = nativeScenarioFixture("DOMAIN-02");
  assert.ok(naval.capabilityLimits.length);
  assert.deepEqual(naval.recipe.variants.filter((v) => v.aiFaction === "Skaduwee").map((v) =>
    naval.assertions["DOMAIN-02"].requiredNativeScenario.branchByVariant[v.id]), ["unsupported"]);
  assert.ok(nativeScenarioFixture("C-06").capabilityLimits.some((limit) => limit.includes("unsupported")));
});

test("recovery bindings preserve actual obstruction, healthy work and finite pending/error inputs", () => {
  for (const [id, branch, mutate] of [
    ["H-01", "persistent", (world) => world.events = []],
    ["H-02", "circling_worker", (world) => world.controls = []],
    ["H-03", "training", (world) => world.queues = []],
    ["H-03", "crop", (world) => world.initialOrders = []],
    ["H-04", "income_parent", (world) => world.actors = world.actors.filter((a) => a.fixtureActorId !== "blocked-source")],
    ["H-19", "pending", (world) => world.routeOutages[0].mode = "null"],
    ["H-19", "error", (world) => world.routeOutages[0].mode = "pending"],
    ["H-24", "unsafe", (world) => world.actors = world.actors.filter((a) => !a.fixtureActorId.startsWith("known-danger-"))],
    ["H-25", "alternative", (world) => world.controls = []],
    ["H-26", "threat_clears", (world) => world.events = []]
  ]) {
    const fixture = nativeScenarioFixture(id), contract = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((value) => contract.branchByVariant[value.id] === branch);
    assert.ok(variant);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
});

test("H-21 native larger-unit clearance is explicitly deferred by the user", () => {
  const manifest = JSON.parse(readFileSync(new URL("./fixtures/skirmish-v1.json", import.meta.url)));
  const row = manifest.rows.find((row) => row.id === "H-21");
  assert.equal(Object.hasOwn(nativeScenarioBindings.cases, "H-21"), false);
  assert.equal(row.runtimeRecipeDraft, undefined);
  assert.equal(row.runtimeSupport.status, "deferred_content");
  assert.equal(row.runtimeSupport.issue, 759);
  assert.match(row.runtimeSupport.reason, /User 2026-10-21/);
});
