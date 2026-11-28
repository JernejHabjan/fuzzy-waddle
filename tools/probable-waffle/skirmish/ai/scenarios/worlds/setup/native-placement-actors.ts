import type { NativeActorLayoutContext } from "../../../contracts/scenarios/native-actor-layout-context.ts";

/** Applies the original family controls before the runtime validates and seals the preset. */
export function configureNativePlacementActors(context: NativeActorLayoutContext): void {
  const { id, own, enemy, branch, actors, wall, placement, tile, actor, melee } = context;

  if (placement) {
    actors.push(actor("worker-transit", `${own}WorkerMale`, 2, 28, 31), actor("army-transit", melee(own), 2, 27, 25));
    if (id === "PLACE-03" && branch !== "layout")
      actors.find((entry) => entry.fixtureActorId === "scout-probe").position =
        branch === "completion" ? tile(26, 24) : tile(41, 24);
    if (id === "PLACE-03" && branch === "layout")
      actors.find((entry) => entry.fixtureActorId === "scout-probe").position = tile(21, 31);
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
    if (id === "PLACE-03" && branch === "layout")
      // Start after the food-capacity floor so the layout case measures varied useful
      // placement choices instead of spending its first build prefixes on emergency Fields.
      actors.push(
        actor("ready-field-1", "Field", 2, 37, 33),
        actor("ready-field-2", "Field", 2, 42, 33),
        actor("ready-field-3", "Field", 2, 32, 34)
      );
    if (branch === "loss") actors.push(actor("perimeter-wall", "Wall", 2, 30, 22));
    if (["exposed", "both_exposed"].includes(branch)) actors.push(actor("outer-threat", "WatchTower", 1, 29, 29));
    if (branch === "both_exposed") actors.push(actor("inner-threat", "WatchTower", 1, 45, 29));
    if (id === "PLACE-02") {
      for (let index = 0; index < 4; index++)
        actors.find((entry) => entry.fixtureActorId === "worker-" + index).position = tile(34 + index, 25);
      actors.find((entry) => entry.fixtureActorId === "ready-house").position = tile(44, 22);
    }
  }
  if (id === "STRAT-05" && branch === "blocked_retreat") {
    actors.find((entry) => entry.fixtureActorId === "front-target-b").position = tile(20, 20);
    actors.find((entry) => entry.fixtureActorId === "enemy-deposit").position = tile(16, 30);
  }
  if (wall) {
    if (id === "WALL-01")
      actors.push(
        actor("protected-deposit", "WorkMill", 2, 29, 21),
        actor("worker-transit", `${own}WorkerMale`, 2, 28, 31),
        actor("army-transit", melee(own), 2, 31, 17)
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
    if (id === "WALL-02") {
      actors.push(
        actor("ready-field-1", "Field", 2, 35, 29),
        actor("ready-field-2", "Field", 2, 38, 30),
        actor("ready-field-3", "Field", 2, 33, 38)
      );
      // Keep the existing stair clear of the nearby resource deposit and the authored wall front.
      actors.find((entry) => entry.fixtureActorId === "perimeter-stair").position = tile(42, 38);
      // Keep the protected deposit outside the measured three-wide army corridor.
      actors.find((entry) => entry.fixtureActorId === "protected-deposit").position = tile(42, 30);
      // Keep the builders outside the authored wall/deposit footprints and beside the gate stair.
      actors.find((entry) => entry.fixtureActorId === "worker-0").position = tile(28, 22);
      actors.find((entry) => entry.fixtureActorId === "worker-1").position = tile(27, 22);
      // Keep route probes together on the measured west-facing approach.
      const routeRow = own === "Tivara" ? (branch === "worker" ? 22 : branch === "enemy_opening" ? 19 : 18) : 19;
      const workerTransitPosition =
        own === "Tivara" && branch === "worker"
          ? tile(32, routeRow)
          : own === "Tivara" && ["army", "concurrent"].includes(branch)
            ? tile(30, routeRow)
            : tile(30, 19);
      actors.find((entry) => entry.fixtureActorId === "worker-transit").position = workerTransitPosition;
      if (["army", "concurrent"].includes(branch)) {
        const armyTransit = actors.find((entry) => entry.fixtureActorId === "army-transit");
        armyTransit.position = tile(32, 22);
      }
    }
    if (["defended", "redundant"].includes(branch)) actors.push(actor("existing-tower", "WatchTower", 2, 28, 24));
    if (branch === "air")
      actors.push(actor("air-threat", enemy === "Skaduwee" ? "SkaduweeOwl" : "TivaraAlchemist", 1, 23, 23));
    if (id === "WALL-05" && branch === "shore") actors.push(actor("shore-transit", `${own}WorkerMale`, 2, 26, 26));
    if (id === "WALL-02" && branch === "enemy_opening") actors.push(actor("hostile-transit", melee(enemy), 1, 22, 18));
    if (branch === "multiple_bases")
      actors.push(actor("second-home", own === "Tivara" ? "Sandhold" : "FrostForge", 2, 38, 36));
  }
  if (id === "WALL-01") {
    // Keep housing buffers outside the local candidate search: structures count as static
    // terrain anchors, so a nearby house could create a false, unrelated fortification front.
    actors.find((entry) => entry.fixtureActorId === "ready-house").position = tile(8, 8);
    // The shared starting worker row overlaps the Sandhold footprint; put the focused builders
    // on adjacent open tiles so native pathing can reach fortification sites from the start.
    for (const [index, [x, y]] of [
      [31, 22],
      [32, 22],
      [33, 22]
    ].entries())
      actors.find((entry) => entry.fixtureActorId === `worker-${index}`).position = tile(x, y);
    // Keep the same initial army position in both positive branches. The terrain comparison
    // should differ only by its cliff anchors, while the planner must keep this unit protected.
    actors.find((entry) => entry.fixtureActorId === "army-0").position = tile(32, 25);
    // Start after the macro survival floor: two ready Fields serve the three fixture
    // workers, keeping the focused defense case out of the unrelated food-opening loop.
    actors.push(actor("ready-field-1", "Field", 2, 35, 29), actor("ready-field-2", "Field", 2, 38, 30));
    // Use a ranged attacker at the east front so the opponent does not rush past the planned
    // perimeter before the native build decision is observed.
    if (branch !== "no_value") {
      actors.find((entry) => entry.fixtureActorId === "enemy-producer").position = tile(45, 20);
      actors.push(
        actor("wall-approach-probe", enemy === "Tivara" ? "TivaraSlingshotFemale" : "SkaduweeRangedFemale", 1, 42, 16)
      );
    }
    // WALL-01 isolates the optional fortification plan. Start with its essential housing
    // buffer met so the manager is not correctly held behind unmet supply demand.
    const housing = own === "Tivara" ? "Olival" : "Emberstone";
    actors.push(actor("fortification-house-1", housing, 2, 8, 14), actor("fortification-house-2", housing, 2, 8, 20));
  }
  if (id === "H-27" && branch === "uncovered")
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(28, 21);
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
  if (id === "STRAT-07" && branch === "breach") {
    actors.find((entry) => entry.fixtureActorId === "scout-probe").position = tile(29, 24);
    actors.push(actor("opportunity-wall", "Wall", 1, 27, 24));
  }
}
