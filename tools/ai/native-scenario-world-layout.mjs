/** Concrete role/position authoring; effective capabilities and prices are still resolved by the real runtime. */
export function nativeScenarioActors(id, own, enemy, branch) {
  const tile = (x, y) => ({ x: (x - y) * 32 + 32, y: (x + y) * 16 + 16, z: 0 });
  const actor = (fixtureActorId, actorName, owner, x, y) => ({ fixtureActorId, actorName, owner, position: tile(x, y) });
  const melee = (faction) => faction === "Tivara" ? "TivaraMacemanMale" : "SkaduweeWarriorMale";
  const ranged = (faction) => faction === "Tivara" ? "TivaraSlingshotFemale" : "SkaduweeRangedFemale";
  const producer = (faction) => faction === "Tivara" ? "AnkGuard" : "InfantryInn";
  const caster = (faction) => faction === "Tivara" ? "TivaraSlingshotFemale" : "SkaduweeMagicianFemale";
  const scouting = id.startsWith("SCOUT-") || id === "H-22", placement = id.startsWith("PLACE-");
  const wall = id.startsWith("WALL-") || ["H-27", "H-28"].includes(id);
  const hidden = id === "SCOUT-01" || id === "SCOUT-04";
  const target = id === "SCOUT-02" ? enemy === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl" :
    id === "SCOUT-04" && branch === "producer" ? producer(enemy) :
    id === "SCOUT-04" || ["STRAT-07", "STRAT-12", "RAID-01"].includes(id) ? "WorkMill" : melee(enemy);
  const actors = [
    ...Array.from({ length: placement ? 16 : 8 }, (_, i) =>
      actor(`worker-${i}`, `${own}WorkerMale`, 2, 32 + i % 4, 21 + Math.floor(i / 4))),
    ...Array.from({ length: scouting || placement ? 0 : 8 }, (_, i) =>
      actor(`army-${i}`, i < 6 ? melee(own) : ranged(own), 2, 29 + i % 4, 25 + Math.floor(i / 4))),
    actor("ready-producer", producer(own), 2, 37, 23),
    actor("ready-house", own === "Tivara" ? "Olival" : "Emberstone", 2, 39, 18),
    actor("own-deposit", "WorkMill", 2, 32, 30), actor("own-source", "Tree1", null, 32, 34),
    actor("ready-granary", "Granary", 2, 38, 29),
    actor("scout-probe", melee(own), 2, hidden ? 30 : 27, 24),
    actor("ranged-probe", ranged(own), 2, 30, 27),
    actor("support-probe", caster(own), 2, 32, 27),
    actor("contact-group", target, 1, hidden ? branch === "hidden_b" ? 10 : 12 : 23, hidden ? 28 : 24),
    actor("enemy-producer", producer(enemy), 1, 12, 18),
    actor("enemy-deposit", "WorkMill", 1, 17, 28), actor("enemy-source", "Tree1", null, 17, 32),
    actor("enemy-worker", `${enemy}WorkerMale`, 1, 18, 30),
    actor("front-target-a", producer(enemy), 1, 20, 16), actor("front-target-b", producer(enemy), 1, 20, 34),
    actor("noise-scout", `${enemy}WorkerMale`, 1, 16, 8)
  ];
  if (id === "SCOUT-02") {
    // Keep the opening contact in scout vision without starting the probe inside its
    // attack radius; this case measures stale information service after withdrawal.
    actors.find((entry) => entry.fixtureActorId === "scout-probe").position = tile(35, 24);
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(28, 24);
  }
  if (id === "FIGHT-01") {
    // Start the favorable contact within one decision's travel of the authored army.
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(27, 25);
  }
  if (id === "FIGHT-05" && branch === "target_loss") {
    // Let native AI damage the original target before the scheduled loss event.
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(25, 24);
  }
  if (id === "SCOUT-01") {
    // Keep the opposing base roster outside the player's opening vision. Otherwise this
    // hidden-start case immediately becomes an attack scenario and never exercises scouting.
    const enemyPositions = {
      "enemy-producer": [6, 18],
      "enemy-deposit": [6, 28],
      "enemy-source": [7, 30],
      "enemy-worker": [8, 30],
      "front-target-a": [8, 16],
      "front-target-b": [8, 34],
      "noise-scout": [6, 8]
    };
    for (const entry of actors) {
      const position = enemyPositions[entry.fixtureActorId];
      if (position) entry.position = tile(...position);
    }
  }
  if (placement) {
    actors.push(actor("worker-transit", `${own}WorkerMale`, 2, 28, 31), actor("army-transit", melee(own), 2, 27, 25));
    if (branch === "loss") actors.push(actor("perimeter-wall", "Wall", 2, 30, 22));
    if (["exposed", "both_exposed"].includes(branch)) actors.push(actor("outer-threat", "WatchTower", 1, 29, 29));
    if (branch === "both_exposed") actors.push(actor("inner-threat", "WatchTower", 1, 38, 15));
  }
  if (id === "STRAT-05" && branch === "blocked_retreat")
    actors.find((entry) => entry.fixtureActorId === "front-target-b").position = tile(20, 20);
  if (wall) {
    actors.push(actor("perimeter-stair", "Stairs", 2, 29, 22), actor("perimeter-wall", "Wall", 2, 30, 22),
      actor("perimeter-wall-2", "Wall", 2, 31, 22), actor("protected-deposit", "WorkMill", 2, 32, 21),
      actor("worker-transit", `${own}WorkerMale`, 2, 28, 31), actor("army-transit", melee(own), 2, 27, 25));
    if (["defended", "redundant"].includes(branch)) actors.push(actor("existing-tower", "WatchTower", 2, 28, 24));
    if (branch === "air") actors.push(actor("air-threat", enemy === "Skaduwee" ? "SkaduweeOwl" : "TivaraAlchemist", 1, 23, 23));
    if (id === "WALL-05" && branch === "shore") actors.push(actor("shore-transit", `${own}WorkerMale`, 2, 26, 26));
    if (branch === "multiple_bases") actors.push(actor("second-home", own === "Tivara" ? "Sandhold" : "FrostForge", 2, 38, 36));
  }
  if (id === "H-27" && branch === "uncovered")
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(28, 21);
  if ((id === "STRAT-04" ? branch === "real_threat" :
    ["STRAT-05", "STRAT-12", "STRAT-13", "FIGHT-01", "FIGHT-03"].includes(id))) {
    for (let i = 0; i < 12; i++) actors.push(actor(`reinforcement-${i}`, melee(enemy), 1, 4 + i % 4, 8 + Math.floor(i / 4)));
  }
  if (["STRAT-07", "RAID-01"].includes(id) && ["defended", "protected"].includes(branch))
    for (let i = 0; i < 8; i++) actors.push(actor(`target-defense-${i}`, melee(enemy), 1, 21 + i % 3, 23 + Math.floor(i / 3)));
  if (id === "STRAT-07" && branch === "breach")
    actors.push(actor("opportunity-wall", "Wall", 1, 27, 24));
  if (id === "FIGHT-02") {
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(28, 27);
    if (branch === "safe_shot") {
      actors.find((entry) => entry.fixtureActorId === "ranged-probe").position = tile(33, 27);
      actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(29, 27);
    }
    // The no-heal control has no support actor; the other branches retain a real covering ally.
    if (branch === "no_heal") return actors.filter((entry) => entry.fixtureActorId !== "support-probe");
  }
  if (id === "FIGHT-04") actors.push(actor("own-research", producer(own), 2, 40, 26));
  if (id === "FIGHT-04" && branch === "overkill") {
    // Keep both required attack targets inside the opening army's real weapon envelope.
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(28, 25);
    actors.find((entry) => entry.fixtureActorId === "front-target-a").position = tile(26, 27);
  }
  if (id === "FIGHT-05" && ["stun", "slow"].includes(branch)) actors.push(
    actor("enemy-research", producer(enemy), 1, 12, 22),
    actor("enemy-caster", caster(enemy), 1, 26, 27));
  if (["STRAT-07", "RAID-01"].includes(id) && branch !== "unfinished") {
    actors.find((entry) => entry.fixtureActorId === "enemy-worker").position = tile(23, 27);
    actors.find((entry) => entry.fixtureActorId === "enemy-source").position = tile(22, 28);
    actors.find((entry) => entry.fixtureActorId === "enemy-deposit").position = tile(12, 36);
  }
  if (["STRAT-13", "FIGHT-03"].includes(id)) {
    if (id === "FIGHT-03") {
      // This case measures only its two authored fronts; unrelated economy targets would consume the bounded raid slot.
      for (const fixtureActorId of ["noise-scout", "enemy-deposit", "enemy-source", "enemy-worker"]) {
        const actorIndex = actors.findIndex((entry) => entry.fixtureActorId === fixtureActorId);
        if (actorIndex >= 0) actors.splice(actorIndex, 1);
      }
      actors.find((entry) => entry.fixtureActorId === "front-target-a").position = tile(22, 18);
      actors.find((entry) => entry.fixtureActorId === "front-target-b").position = tile(22, 32);
    }
    actors.push(actor("front-observer-a", melee(own), 2, 25, 20), actor("front-observer-b", melee(own), 2, 25, 32));
    if (id === "FIGHT-03" && branch !== "equal") {
      // Keep the valuable main building alive for the authored tick-400 loss/escalation boundary.
      actors.find((entry) => entry.fixtureActorId === "front-target-a").position = tile(20, 5);
      actors.find((entry) => entry.fixtureActorId === "front-target-a").actorName = enemy === "Tivara" ? "Sandhold" : "FrostForge";
      actors.find((entry) => entry.fixtureActorId === "front-target-b").position = tile(42, 38);
      actors.find((entry) => entry.fixtureActorId === "front-observer-a").position = tile(22, 10);
      actors.find((entry) => entry.fixtureActorId === "front-observer-b").position = tile(40, 32);
      for (const [index, [x, y]] of [[27, 28], [28, 28], [29, 28], [30, 28], [28, 29], [29, 29]].entries())
        actors.push(actor(`front-reinforcement-${index}`, melee(own), 2, x, y));
    }
  }
  if (id === "STRAT-11" && branch === "resource") {
    actors.find((entry) => entry.fixtureActorId === "own-source").position = tile(22, 24);
    actors.find((entry) => entry.fixtureActorId === "own-deposit").position = tile(32, 24);
  }
  if (id === "STRAT-11" && branch === "irrelevant")
    actors.find((entry) => entry.fixtureActorId === "scout-probe").position = tile(5, 5);
  if (id === "SCOUT-03" && branch === "trapped" || id === "FIGHT-05" && branch === "disconnected")
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(28, 25);
  if (id === "SCOUT-03" && branch === "escape") {
    // Exercise an actual scouting escape: the faction's fast flyer outruns the slower ranged
    // anti-air pursuer. Ground melee units move at the same pace and cannot leave its sight on
    // the open test map, making that setup an impossible escape premise.
    actors.find((entry) => entry.fixtureActorId === "scout-probe").actorName =
      own === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl";
    actors.find((entry) => entry.fixtureActorId === "contact-group").actorName = ranged(enemy);
    actors.find((entry) => entry.fixtureActorId === "scout-probe").position = tile(25, 24);
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(8, 24);
  }
  if (id === "PLACE-01" && branch === "constrained")
    actors.find((entry) => entry.fixtureActorId === "worker-transit").position = tile(34, 30);
  return actors;
}

/** Actual native tile geometry on the frozen open map; not a fictitious map label or an AI access-graph injection. */
export function nativeScenarioTerrain(id, branch) {
  const bridge = id === "WALL-01" && branch === "terrain" || id === "WALL-05" ||
    id === "SCOUT-04" && branch === "approach" || id === "STRAT-11" && branch === "bridge";
  const patches = [];
  if (bridge) for (let y = 0; y < 50; y++) for (const x of [24, 25]) {
    if (y >= 20 && y <= 25 || id === "SCOUT-04" && y >= 34 && y <= 37) continue;
    patches.push({ x, y, terrain: "water", blocked: false });
  }
  if (id === "STRAT-05" && branch === "blocked_retreat") {
    // Keep the opening target reachable, but separate the forward force from its home-side fallback.
    for (let x = 0; x < 50; x++) patches.push({ x, y: 28, terrain: "grass", blocked: true });
  } else if (branch === "trapped" || branch === "disconnected") {
    for (let x = 25; x <= 31; x++) for (let y = 22; y <= 28; y++)
      if (x === 25 || x === 31 || y === 22 || y === 28) patches.push({ x, y, terrain: "grass", blocked: true });
  }
  if (id === "STRAT-07" && branch === "breach") {
    for (let x = 18; x <= 27; x++) for (let y = 18; y <= 30; y++) {
      if ((x === 18 || x === 27 || y === 18 || y === 30) && !(x === 27 && y === 24))
        patches.push({ x, y, terrain: "grass", blocked: true });
    }
  }
  if (id === "PLACE-01" && branch === "constrained") {
    for (let x = 0; x < 50; x++) for (let y = 0; y < 50; y++) {
      const clearing = x >= 29 && x <= 31 && y >= 32 && y <= 34;
      const vertical = x >= 34 && x <= 35 && y >= 19 && y <= 33;
      const armyRoad = y >= 25 && y <= 26 && x >= 27 && x <= 44;
      const fieldRoad = y === 33 && x >= 29 && x <= 35;
      if (clearing || vertical || armyRoad || fieldRoad) continue;
      patches.push({ x, y, terrain: "grass", blocked: true });
    }
  }
  return patches;
}
