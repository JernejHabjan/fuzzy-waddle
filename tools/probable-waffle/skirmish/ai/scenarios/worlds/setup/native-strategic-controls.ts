import type { NativeWorldSetupContext } from "../../../contracts/scenarios/native-world-setup-context.ts";
import { tile, melee, producer } from "../native-world-geometry.ts";

/** Applies the original family controls before the runtime validates and seals the preset. */
export function configureNativeStrategicControls(context: NativeWorldSetupContext): void {
  const { id, branch, own, enemy, world, actors, army, move, attack, loss, reinforcements } = context;

  if (id === "SCOUT-02" && branch !== "visible") {
    // Withdraw away from the active AI's vision and scout route. Skaduwee contacts pursue
    // the scout, so keep both paired destinations in the southern map band.
    const destination =
      own === "Skaduwee"
        ? branch === "hidden_position"
          ? [48, 48]
          : [44, 44]
        : branch === "hidden_position"
          ? [48, 48]
          : [45, 45];
    move("contact-group", 20, destination[0], destination[1]);
    // The autonomous enemy can retarget the investigating scout after withdrawal. Reissue
    // the same retreat after the first arrival, before it can carry the contact back into vision.
    move("contact-group", 200, destination[0], destination[1]);
    move("contact-group", 320, destination[0], destination[1]);
    move("contact-group", 600, destination[0], destination[1]);
    if (branch === "hidden_health")
      world.events.push({
        id: "hidden-damage",
        tick: 600,
        kind: "damage_owned_actor",
        owner: 1,
        objectName: actors.get("contact-group").actorName,
        fixtureActorId: "contact-group",
        damage: 5
      });
    if (branch === "hidden_queue")
      world.controls.push({
        id: "hidden-queue",
        producerFixtureActorId: "enemy-producer",
        requestTick: 600,
        applicationTick: 600,
        action: { kind: "produce", actorName: melee(enemy) }
      });
  }
  if (id === "H-22") move("contact-group", 200, branch === "remains" ? 20 : 6, branch === "remains" ? 30 : 8);
  if (id === "SCOUT-03") attack("contact-group", "scout-probe", 200);
  if (id === "STRAT-04" && branch !== "quiet") {
    for (const [tick, x, y] of [
      [400, 30, 21],
      [600, 16, 8],
      [800, 30, 21],
      [1000, 16, 8]
    ])
      move("noise-scout", tick, x, y);
    if (branch === "real_threat") reinforcements();
  }
  if (["STRAT-05", "FIGHT-01"].includes(id) && ["reinforced", "blocked_retreat"].includes(branch)) reinforcements();
  if ((id === "STRAT-06" && branch === "damaged") || (id === "STRAT-10" && branch === "combined_loss")) {
    for (let index = 0; index < 4; index++) loss(`worker-${index}`, 200);
    if (id === "STRAT-10") {
      loss("ready-producer", 200);
      for (const role of army.slice(0, 5)) loss(role, 200);
    }
  }
  if (["STRAT-07", "RAID-01"].includes(id) && branch === "unfinished") {
    world.actors = world.actors.filter((actor) => actor.fixtureActorId !== "contact-group");
    world.constructionOrders = [
      {
        fixtureActorId: "contact-group",
        actorName: producer(enemy),
        builderFixtureActorIds: ["enemy-worker"],
        position: tile(19, 27)
      }
    ];
  }
  if (id === "STRAT-07" && branch === "breach") loss("opportunity-wall", 400);
  if (id === "STRAT-12" && branch === "own_threat") {
    for (let index = 0; index < 3; index++) attack(`reinforcement-${index}`, "own-deposit", 400);
  }
  if (["STRAT-13", "FIGHT-03"].includes(id)) {
    if (branch === "escalated" || branch === "unequal") reinforcements(3);
    if (branch === "infeasible") loss("front-target-a", id === "FIGHT-03" ? 400 : 600);
  }
}
