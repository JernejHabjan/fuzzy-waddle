import type { NativeScenarioWorld } from "../../contracts/scenarios/native-scenario-world.ts";
import { nativeScenarioWorld, tile, melee, producer } from "./native-scenario-worlds.ts";
import { control } from "./native-domain-worlds.ts";

/** Native queues, observations and opposing actions for classic RTS decisions; never seeds planner state. */
export function nativeClassicWorld(id, faction, branch): NativeScenarioWorld {
  const world = nativeScenarioWorld(id, faction, branch),
    enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  const add = (role, name, owner, x, y) =>
    world.actors.push({ fixtureActorId: role, actorName: name, owner, position: tile(x, y) });
  const find = (role) => world.actors.find((actor) => actor.fixtureActorId === role);
  for (let i = 0; i < 3; i++)
    add(`reserve-house-${i}`, faction === "Tivara" ? "Olival" : "Emberstone", 2, 41, 31 + i * 4);
  if (id === "C-01") {
    // Four 60-food infantry commands are paid before resourceStarts resets the observed post-setup balance.
    world.resourceGrants.push({ playerNumber: 2, amounts: { food: 80 } });
    world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 4 }];
    add("new-contact", enemy === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl", 1, 5, 5);
    world.controls.push(
      control("transition-contact", "new-contact", 200, { kind: "move", worldPosition: tile(27, 23) })
    );
    if (branch === "obsolete")
      for (let i = 0; i < 3; i++) {
        add(`air-counter-${i}`, enemy === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl", 1, 5 + i, 7);
        world.controls.push(
          control(`transition-air-${i}`, `air-counter-${i}`, 200, {
            kind: "attack",
            targetFixtureActorId: "original-home"
          })
        );
      }
  }
  if (id === "C-02") {
    world.queues = [
      {
        producerFixtureActorId: "ready-producer",
        actorName: melee(faction),
        count: branch === "window_closed" ? 5 : branch === "optional_delayed" ? 4 : 1
      }
    ];
    if (branch !== "optional_delayed")
      world.researchQueues = [
        {
          producerFixtureActorId: "ready-producer",
          researchType: faction === "Tivara" ? "tivaraMacemanUpgradeLevel2" : "skaduweeWarriorUpgradeLevel2"
        }
      ];
    const close = branch === "window_closed" ? 800 : 1200;
    for (let i = 0; i < 12; i++) {
      add(`window-counter-${i}`, melee(enemy), 1, 5 + (i % 4), 5 + Math.floor(i / 4));
      world.controls.push(
        control(`window-close-${i}`, `window-counter-${i}`, close, {
          kind: "move",
          worldPosition: tile(23 + (i % 3), 23 + Math.floor(i / 3))
        })
      );
    }
  }
  if (id === "C-03") {
    if (branch === "fulfilled")
      for (let i = 8; i < 24; i++) add(`army-${i}`, melee(faction), 2, 29 + (i % 4), 30 + Math.floor(i / 4));
    if (branch === "paid_queue")
      world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 4 }];
    if (branch === "need_removed")
      world.events.push({
        id: "loss-original-mission",
        tick: 800,
        kind: "destroy_owned_actor",
        owner: 1,
        objectName: find("contact-group").actorName,
        fixtureActorId: "contact-group"
      });
    world.productionRallies = [
      {
        owner: 2,
        producerObjectName: faction === "Tivara" ? "AnkGuard" : "InfantryInn",
        targetFixtureActorId: "scout-probe"
      }
    ];
  }
  if (id === "C-04") {
    find("scout-probe").actorName = faction === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl";
    find("contact-group").actorName = branch === "irrelevant" ? `${enemy}WorkerMale` : producer(enemy);
    find("contact-group").position = branch === "repeated" ? tile(23, 28) : tile(12, 28);
    if (branch === "distinct") {
      add("distinct-contact", enemy === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl", 1, 5, 5);
      world.controls.push(
        control("new-distinct-contact", "distinct-contact", 200, { kind: "move", worldPosition: tile(24, 26) })
      );
    }
    if (branch === "irrelevant") find("contact-group").actorName = `${enemy}WorkerMale`;
    const roles = new Set([
      "worker-0",
      "worker-1",
      "ready-producer",
      "ready-house",
      "own-deposit",
      "own-source",
      "scout-probe",
      "ranged-probe",
      "army-0",
      "army-1",
      "contact-group",
      ...(branch === "distinct" ? ["distinct-contact"] : [])
    ]);
    world.actors = world.actors.filter((actor) => roles.has(actor.fixtureActorId));
    world.initialOrders = world.initialOrders.filter((order) => roles.has(order.workerFixtureActorId));
  }
  if (id === "C-05") {
    find("contact-group").actorName =
      branch === "valuable"
        ? enemy === "Tivara"
          ? "TivaraAlchemist"
          : "SkaduweeMagicianFemale"
        : `${enemy}WorkerMale`;
    find("contact-group").position = tile(30, 13);
    // Keep the protected service, bait engagement and post-battle objective around player 2's actual home base.
    find("worker-0").position = tile(32, 10);
    find("worker-1").position = tile(34, 10);
    for (let index = 0; index < 8; index++)
      find(`army-${index}`).position = tile(29 + (index % 4), 11 + Math.floor(index / 4));
    find("ready-producer").position = tile(36, 10);
    find("ready-house").position = tile(36, 13);
    find("own-deposit").position = tile(32, 13);
    find("own-source").position = tile(32, 16);
    find("ready-granary").position = tile(34, 14);
    find("front-target-a").actorName = enemy === "Tivara" ? "Sandhold" : "FrostForge";
    find("front-target-a").position = tile(13, 12);
    const pursuitDangerCount = branch === "unsafe" ? 6 : ["bait", "valuable"].includes(branch) ? 1 : 0;
    world.controls.push(
      control("bait-attack", "contact-group", 200, { kind: "attack", targetFixtureActorId: "worker-0" })
    );
    if (["bait", "valuable"].includes(branch))
      world.controls.push(control("bait-retreat", "contact-group", 600, { kind: "move", worldPosition: tile(23, 18) }));
    for (let i = 0; i < pursuitDangerCount; i++)
      add(`pursuit-danger-${i}`, "WatchTower", 1, 20 - (i % 3) * 4, 18 + Math.floor(i / 3) * 4);
    const focusedRoles = new Set([
      "worker-0",
      "worker-1",
      ...Array.from({ length: 8 }, (_, index) => `army-${index}`),
      "ready-producer",
      "ready-house",
      "reserve-house-0",
      "own-deposit",
      "own-source",
      "ready-granary",
      "contact-group",
      "front-target-a",
      ...Array.from({ length: pursuitDangerCount }, (_, index) => `pursuit-danger-${index}`)
    ]);
    world.actors = world.actors.filter((actor) => focusedRoles.has(actor.fixtureActorId));
    world.initialOrders = world.initialOrders.filter((order) => focusedRoles.has(order.workerFixtureActorId));
  }
  if (id === "C-06") {
    // Player3 is created through the ordinary three-spawn lobby, not synthesized into a two-player scene.
    world.existingActorBindings.push({
      fixtureActorId: "third-home",
      actorName: enemy === "Tivara" ? "Sandhold" : "FrostForge",
      owner: 3
    });
    add("third-front", `${enemy}WorkerMale`, 3, 25, 34);
    add("third-raider", melee(enemy), 3, 31, 34);
    world.controls.push(
      control("third-local-attack", "third-raider", branch === "local_threat" ? 400 : 1200, {
        kind: "attack",
        targetFixtureActorId: "own-deposit"
      })
    );
    // The focused opponent must lose through actual combat. No concede or forced defeat event is authored.
    for (let i = 8; i < 30; i++) add(`army-${i}`, melee(faction), 2, 20 + (i % 4), 24 + Math.floor(i / 4));
  }
  return world;
}
