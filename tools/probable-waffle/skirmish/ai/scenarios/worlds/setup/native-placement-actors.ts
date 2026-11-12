import type { NativeActorLayoutContext } from "../../../contracts/scenarios/native-actor-layout-context.ts";

/** Applies the original family controls before the runtime validates and seals the preset. */
export function configureNativePlacementActors(context: NativeActorLayoutContext): void {
  const { id, own, enemy, branch, actors, wall, placement, tile, actor, melee } = context;

  if (placement) {
    actors.push(actor("worker-transit", `${own}WorkerMale`, 2, 28, 31), actor("army-transit", melee(own), 2, 27, 25));
    if (id === "PLACE-03" && branch === "concurrent") {
      // Keep the physical route probes out of combat range; this branch measures whether
      // incremental construction preserves movement, not whether a combat mission replaces a move.
      const remoteEnemyStarts = {
        "contact-group": [5, 5],
        "enemy-producer": [8, 8],
        "enemy-deposit": [5, 15],
        "enemy-worker": [8, 20],
        "front-target-a": [4, 10],
        "front-target-b": [8, 14],
        "noise-scout": [5, 20]
      };
      for (const [fixtureActorId, position] of Object.entries(remoteEnemyStarts))
        actors.find((entry) => entry.fixtureActorId === fixtureActorId).position = tile(position[0], position[1]);
    }
    if (branch === "loss") actors.push(actor("perimeter-wall", "Wall", 2, 30, 22));
    if (["exposed", "both_exposed"].includes(branch)) actors.push(actor("outer-threat", "WatchTower", 1, 29, 29));
    if (branch === "both_exposed") actors.push(actor("inner-threat", "WatchTower", 1, 38, 15));
  }
  if (id === "STRAT-05" && branch === "blocked_retreat")
    actors.find((entry) => entry.fixtureActorId === "front-target-b").position = tile(20, 20);
  if (wall) {
    if (id === "WALL-01" && branch === "terrain")
      actors.push(
        actor("protected-deposit", "WorkMill", 2, 36, 26),
        actor("worker-transit", `${own}WorkerMale`, 2, 28, 31),
        actor("army-transit", melee(own), 2, 27, 25)
      );
    else
      actors.push(
        actor("perimeter-stair", "Stairs", 2, 29, 22),
        actor("perimeter-wall", "Wall", 2, 30, 22),
        actor("perimeter-wall-2", "Wall", 2, 31, 22),
        actor("protected-deposit", "WorkMill", 2, 32, 21),
        actor("worker-transit", `${own}WorkerMale`, 2, 28, 31),
        actor("army-transit", melee(own), 2, 27, 25)
      );
    if (["defended", "redundant"].includes(branch)) actors.push(actor("existing-tower", "WatchTower", 2, 28, 24));
    if (branch === "air")
      actors.push(actor("air-threat", enemy === "Skaduwee" ? "SkaduweeOwl" : "TivaraAlchemist", 1, 23, 23));
    if (id === "WALL-05" && branch === "shore") actors.push(actor("shore-transit", `${own}WorkerMale`, 2, 26, 26));
    if (branch === "multiple_bases")
      actors.push(actor("second-home", own === "Tivara" ? "Sandhold" : "FrostForge", 2, 38, 36));
  }
  if (id === "WALL-01" && branch === "terrain") {
    // WALL-01 isolates the optional fortification plan. Start with its essential housing
    // buffer met so the manager is not correctly held behind unmet supply demand.
    const housing = own === "Tivara" ? "Olival" : "Emberstone";
    actors.push(actor("fortification-house-1", housing, 2, 37, 20), actor("fortification-house-2", housing, 2, 40, 20));
  }
  if (id === "H-27" && branch === "uncovered")
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(28, 21);
  if (
    id === "STRAT-04"
      ? branch === "real_threat"
      : ["STRAT-05", "STRAT-12", "STRAT-13", "FIGHT-01", "FIGHT-03"].includes(id)
  ) {
    for (let i = 0; i < 12; i++)
      actors.push(actor(`reinforcement-${i}`, melee(enemy), 1, 4 + (i % 4), 8 + Math.floor(i / 4)));
  }
  if (["STRAT-07", "RAID-01"].includes(id) && ["defended", "protected"].includes(branch))
    for (let i = 0; i < 8; i++)
      actors.push(actor(`target-defense-${i}`, melee(enemy), 1, 21 + (i % 3), 23 + Math.floor(i / 3)));
  if (id === "RAID-01" && branch === "protected") {
    // Keep this negative raid control focused on the defended economy target while a separate
    // main objective remains immediately useful to the opening force. Put defenders on clear
    // approach tiles; stacking them inside the WorkMill footprint hid most of the local defense.
    const defensePositions = Array.from({ length: 8 }, (_, index) => [27, 21 + index]);
    for (const [index, [x, y]] of defensePositions.entries())
      actors.find((entry) => entry.fixtureActorId === `target-defense-${index}`).position = tile(x, y);
    actors.find((entry) => entry.fixtureActorId === "noise-scout").actorName = "Wall";
    actors.find((entry) => entry.fixtureActorId === "front-target-a").position = tile(28, 18);
    actors.find((entry) => entry.fixtureActorId === "front-target-b").position = tile(28, 32);
  }
  if (id === "STRAT-07" && branch === "breach") actors.push(actor("opportunity-wall", "Wall", 1, 27, 24));
}
