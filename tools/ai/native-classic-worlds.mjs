import { nativeScenarioWorld, tile, melee } from "./native-scenario-worlds.mjs";
import { control } from "./native-domain-worlds.mjs";

/** Native queues, observations and opposing actions for classic RTS decisions; never seeds planner state. */
export function nativeClassicWorld(id, faction, branch) {
  const world = nativeScenarioWorld(id, faction, branch), enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  const add = (role, name, owner, x, y) => world.actors.push({ fixtureActorId: role, actorName: name, owner, position: tile(x, y) });
  const find = (role) => world.actors.find((actor) => actor.fixtureActorId === role);
  for (let i = 0; i < 3; i++) add(`reserve-house-${i}`, faction === "Tivara" ? "Olival" : "Emberstone", 2, 41, 31 + i * 4);
  if (id === "C-01") {
    world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 4 }];
    add("new-contact", enemy === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl", 1, 5, 5);
    world.controls.push(control("transition-contact", "new-contact", 400,
      { kind: "move", worldPosition: tile(27, 23) }));
    if (branch === "obsolete") for (let i = 0; i < 3; i++) {
      add(`air-counter-${i}`, enemy === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl", 1, 5 + i, 7);
      world.controls.push(control(`transition-air-${i}`, `air-counter-${i}`, 400,
        { kind: "attack", targetFixtureActorId: "original-home" }));
    }
  }
  if (id === "C-02") {
    world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction),
      count: branch === "window_closed" ? 5 : branch === "optional_delayed" ? 4 : 1 }];
    if (branch !== "optional_delayed") world.researchQueues = [{ producerFixtureActorId: "ready-producer",
      researchType: faction === "Tivara" ? "tivaraMacemanUpgradeLevel2" : "skaduweeWarriorUpgradeLevel2" }];
    const close = branch === "window_closed" ? 800 : 1200;
    for (let i = 0; i < 12; i++) {
      add(`window-counter-${i}`, melee(enemy), 1, 5 + i % 4, 5 + Math.floor(i / 4));
      world.controls.push(control(`window-close-${i}`, `window-counter-${i}`, close,
        { kind: "move", worldPosition: tile(23 + i % 3, 23 + Math.floor(i / 3)) }));
    }
  }
  if (id === "C-03") {
    if (branch === "fulfilled") for (let i = 8; i < 24; i++) add(`army-${i}`, melee(faction), 2, 29 + i % 4, 30 + Math.floor(i / 4));
    if (branch === "paid_queue") world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 4 }];
    if (branch === "need_removed") world.events.push({ id: "loss-original-mission", tick: 800, kind: "destroy_owned_actor",
      owner: 1, objectName: find("contact-group").actorName, fixtureActorId: "contact-group" });
    world.productionRallies = [{ owner: 2, producerObjectName: faction === "Tivara" ? "AnkGuard" : "InfantryInn",
      targetFixtureActorId: "scout-probe" }];
  }
  if (id === "C-04") {
    find("contact-group").actorName = enemy === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl";
    find("contact-group").position = tile(branch === "repeated" ? 23 : 12, 28);
    add("distinct-contact", find("contact-group").actorName, 1, 5, 5);
    if (branch === "distinct") world.controls.push(control("new-distinct-contact", "distinct-contact", 1200,
      { kind: "move", worldPosition: tile(24, 26) }));
    if (branch === "irrelevant") find("contact-group").actorName = `${enemy}WorkerMale`;
  }
  if (id === "C-05") {
    find("contact-group").actorName = branch === "valuable" ? enemy === "Tivara" ? "TivaraAlchemist" : "SkaduweeMagicianFemale" :
      `${enemy}WorkerMale`;
    find("contact-group").position = tile(30, 28);
    world.controls.push(control("bait-attack", "contact-group", 200, { kind: "attack", targetFixtureActorId: "worker-0" }));
    if (["bait", "valuable"].includes(branch)) world.controls.push(control("bait-retreat", "contact-group", 600,
      { kind: "move", worldPosition: tile(17, 30) }));
    for (let i = 0; i < (branch === "unsafe" ? 6 : 3); i++) add(`pursuit-danger-${i}`, "WatchTower", 1,
      14 + i % 3 * 4, 28 + Math.floor(i / 3) * 4);
  }
  if (id === "C-06") {
    // Player3 is created through the ordinary three-spawn lobby, not synthesized into a two-player scene.
    world.existingActorBindings.push({ fixtureActorId: "third-home", actorName: enemy === "Tivara" ? "Sandhold" : "FrostForge", owner: 3 });
    add("third-front", `${enemy}WorkerMale`, 3, 25, 34);
    add("third-raider", melee(enemy), 3, 31, 34);
    world.controls.push(control("third-local-attack", "third-raider", branch === "local_threat" ? 400 : 1200,
      { kind: "attack", targetFixtureActorId: "own-deposit" }));
    // The focused opponent must lose through actual combat. No concede or forced defeat event is authored.
    for (let i = 8; i < 30; i++) add(`army-${i}`, melee(faction), 2, 20 + i % 4, 24 + Math.floor(i / 4));
  }
  return world;
}
