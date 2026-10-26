import { nativeScenarioWorld, tile, melee, producer } from "./native-scenario-worlds.mjs";
import { addNativeBoatRaid, control } from "./native-domain-worlds.mjs";

/** Native offense/home-threat and finishing/comeback branches; every post-start change uses a real owner. */
export function nativeStrategicWorld(id, faction, branch) {
  const world = nativeScenarioWorld(id, faction, branch), enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  world.actors = world.actors.filter((a) => !a.fixtureActorId.startsWith("army-") &&
    !a.fixtureActorId.startsWith("front-target-") && !["contact-group", "noise-scout"].includes(a.fixtureActorId));
  const actor = (role, name, owner, x, y) => ({ fixtureActorId: role, actorName: name, owner, position: tile(x, y) });
  const count = id === "STRAT-09" ? 6 : 30;
  for (let i = 0; i < count; i++) world.actors.push(actor(`army-${i}`,
    i >= count - 6 ? faction === "Tivara" ? "TivaraSlingshotFemale" : "SkaduweeRangedFemale" : melee(faction), 2,
    i >= count - 6 ? 32 + i % 3 : 25 + i % 4, i >= count - 6 ? 19 + i % 2 : 28 + Math.floor(i / 4)));
  if (id === "STRAT-09" && ["denial", "raid", "path_outage"].includes(branch)) {
    for (let i = 0; i < count; i++) {
      const ownArmy = world.actors.find((candidate) => candidate.fixtureActorId === `army-${i}`);
      if (ownArmy) ownArmy.position = tile(36 + (i % 3), 20 + Math.floor(i / 3));
    }
  }
  for (let i = 0; i < 4; i++) world.actors.push(actor(`reserve-house-${i}`,
    faction === "Tivara" ? "Olival" : "Emberstone", 2, 42, 30 + i * 4));
  world.actors.push(actor("main-target", "WorkMill", 1, 16, 30), actor("raid-bait", `${enemy}WorkerMale`, 1, 16, 8));
  if (id === "STRAT-09" && faction === "Skaduwee" && branch === "raid") {
    world.actors.find((candidate) => candidate.fixtureActorId === "main-target").position = tile(26, 26);
  }
  if (
    id === "STRAT-09" &&
    ((faction === "Skaduwee" && branch === "raid") || (faction === "Tivara" && branch === "path_outage"))
  ) {
    const competingDeposit = world.actors.find((candidate) => candidate.fixtureActorId === "enemy-deposit");
    if (competingDeposit) competingDeposit.position = tile(7, 28);
  }
  world.actors.find((a) => a.fixtureActorId === "enemy-source").position = tile(16, 34);
  world.actors.find((a) => a.fixtureActorId === "enemy-worker").position = tile(17, 32);
  world.actors.find((a) => a.fixtureActorId === "scout-probe").position = tile(22, 30);
  if (["STRAT-02", "STRAT-03", "RAID-03"].includes(id)) {
    for (let i = 0; i < 4; i++) {
      world.actors.push(actor(`raider-${i}`, enemy === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl", 1, 4 + i, 5));
      if (branch !== "quiet") world.controls.push(
        control(`raid-arrive-${i}`, `raider-${i}`, 400, { kind: "move", worldPosition: tile(31 + i % 2, 19 + i % 3) }),
        control(`raid-attack-${i}`, `raider-${i}`, 600, { kind: "attack", targetFixtureActorId: `worker-${i}` }));
    }
    if (branch === "boat_raid") addNativeBoatRaid(world);
    if (["reinforced", "withdrawn"].includes(branch)) for (let i = 0; i < 12; i++) {
      world.actors.push(actor(`raid-reinforcement-${i}`, melee(enemy), 1, 5 + i % 4, 10 + Math.floor(i / 4)));
      world.controls.push(control(`raid-reinforce-${i}`, `raid-reinforcement-${i}`, 800,
        { kind: "attack", targetFixtureActorId: "original-home" }));
    }
    if (branch === "withdrawn") {
      for (let i = 0; i < 4; i++) world.controls.push(control(`raid-leave-${i}`, `raider-${i}`, 1200,
        { kind: "move", worldPosition: tile(5 + i, 5) }));
      for (let i = 0; i < 12; i++) world.controls.push(control(`reinforcement-leave-${i}`, `raid-reinforcement-${i}`, 1200,
        { kind: "move", worldPosition: tile(5 + i % 4, 10 + Math.floor(i / 4)) }));
    }
  }
  if (id === "STRAT-08") {
    if (branch === "defended") {
      for (let i = 0; i < 8; i++) {
        world.actors.push(actor(`core-guard-${i}`, melee(enemy), 1, 15 + i % 4, 21 + Math.floor(i / 4)));
        world.controls.push(control(`core-guard-withdraw-${i}`, `core-guard-${i}`, 800,
          { kind: "move", worldPosition: tile(4 + i % 4, 4 + Math.floor(i / 4)) }));
      }
    }
  }
  if (id === "STRAT-09") {
    // A small viable force faces a larger real enemy; the exposed dependency remains a legal comeback opportunity.
    world.resourceStarts.find((entry) => entry.playerNumber === 2).amounts = { food: 100, wood: 100, stone: 0, minerals: 0 };
    for (let i = 0; i < 14; i++) world.actors.push(actor(`enemy-reserve-${i}`, melee(enemy), 1, 6 + i % 4, 9 + Math.floor(i / 4)));
    world.actors.push(actor("enemy-army-observer", melee(faction), 2, 14, 12));
    if (branch === "denial") world.actors.find((a) => a.fixtureActorId === "main-target").actorName = producer(enemy);
    if (branch === "unrecoverable") {
      // Bind every original AI actor, including inherited home/workers, in registration before scheduling native losses.
      world.resourceStarts.find((entry) => entry.playerNumber === 2).amounts = { food: 0, wood: 0, stone: 0, minerals: 0 };
      world.actors = world.actors.filter((actor) => actor.owner !== 2 || actor.fixtureActorId === "worker-0");
      world.events = [{ id: "loss-last-worker", tick: 800, kind: "destroy_owned_actor", owner: 2,
        objectName: `${faction}WorkerMale`, fixtureActorId: "worker-0" },
      { id: "loss-last-home", tick: 800, kind: "destroy_owned_actor", owner: 2,
        objectName: faction === "Tivara" ? "Sandhold" : "FrostForge", fixtureActorId: "original-home" }];
    }
    if (branch === "path_outage") world.routeOutages = [{ id: "comeback-route-outage", fromTick: 400, throughTick: 800,
      fixtureActorIds: Array.from({ length: 6 }, (_, i) => `army-${i}`) }];
  }
  return world;
}
