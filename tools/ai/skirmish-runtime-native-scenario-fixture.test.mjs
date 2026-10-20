import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { nativeScenarioBindings, nativeScenarioFixture } from "./native-scenario-registration.mjs";
import { validNativeScenarioFixture } from "./skirmish-runtime-native-scenario-fixture.mjs";

test("all sixty-two native bindings retain their full branches and original acceptance obligations", () => {
  const ids = Object.keys(nativeScenarioBindings.cases);
  assert.equal(ids.length, 62);
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

test("missing real peer, save, chain, proposal-order and retained-scene premises remain explicit", () => {
  const drafts = JSON.parse(readFileSync(new URL("./fixtures/native-scenario-recipes.json", import.meta.url)));
  for (const id of ["H-08", "H-09", "H-31", "H-32"]) {
    assert.equal(Object.hasOwn(nativeScenarioBindings.cases, id), false);
    const entry = drafts.cases.find((value) => value.scenarioId === id);
    assert.ok(entry.executionBlockers.some((key) => key.startsWith("authority_binding_")));
  }
});

test("native cases cannot downgrade to generic counts or omit a faction, branch or physical channel", () => {
  for (const id of Object.keys(nativeScenarioBindings.cases)) for (const mutate of [
    (value) => delete value.assertions[id].requiredNativeScenario,
    (value) => value.recipe.variants.pop(),
    (value) => value.recipe.variants[0].captureCombat = undefined,
    (value) => value.recipe.variants[0].captureConstruction = undefined,
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

test("unimplemented receipt, disposal, clearance and indispensable-cargo premises are not promoted", () => {
  const drafts = JSON.parse(readFileSync(new URL("./fixtures/native-scenario-recipes.json", import.meta.url)));
  for (const id of ["H-05", "H-20", "H-21", "H-23"]) {
    assert.equal(Object.hasOwn(nativeScenarioBindings.cases, id), false);
    const entry = drafts.cases.find((value) => value.scenarioId === id);
    assert.ok(entry.executionBlockers.some((key) => key.startsWith("recovery_binding_")));
  }
});
