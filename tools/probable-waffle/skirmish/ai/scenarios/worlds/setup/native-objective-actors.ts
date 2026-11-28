import type { NativeActorLayoutContext } from "../../../contracts/scenarios/native-actor-layout-context.ts";

/** Applies the original family controls before the runtime validates and seals the preset. */
export function configureNativeObjectiveActors(context: NativeActorLayoutContext): void {
  const { id, own, enemy, branch, actors, tile, actor, melee, ranged } = context;

  const counterforceWave =
    (id === "STRAT-04" && branch === "real_threat") ||
    (["STRAT-05", "FIGHT-01"].includes(id) && ["reinforced", "blocked_retreat"].includes(branch));
  const nearFrontThreat =
    (id === "STRAT-12" && branch === "own_threat") ||
    (["STRAT-13", "FIGHT-03"].includes(id) && ["escalated", "unequal"].includes(branch));
  const waveSize = id === "FIGHT-01" && branch === "reinforced" ? 4 : counterforceWave ? 12 : nearFrontThreat ? 3 : 0;
  for (let i = 0; i < waveSize; i++) {
    const nearFight = id === "FIGHT-01";
    actors.push(
      actor(
        "reinforcement-" + i,
        nearFight && i % 2 === 1 ? ranged(enemy) : melee(enemy),
        1,
        nearFight
          ? 8 + (i % 4)
          : id === "STRAT-05"
            ? branch === "blocked_retreat"
              ? 2 + (i % 4)
              : 42 + (i % 4)
            : 4 + (i % 4),
        nearFight
          ? 38 + Math.floor(i / 4)
          : id === "STRAT-05"
            ? branch === "blocked_retreat"
              ? 2 + Math.floor(i / 4)
              : 42 + Math.floor(i / 4)
            : 8 + Math.floor(i / 4)
      )
    );
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
      actors.find((entry) => entry.fixtureActorId === "front-target-a").actorName =
        enemy === "Tivara" ? "Sandhold" : "FrostForge";
      actors.find((entry) => entry.fixtureActorId === "front-target-b").position = tile(42, 38);
      actors.find((entry) => entry.fixtureActorId === "front-observer-a").position = tile(22, 10);
      actors.find((entry) => entry.fixtureActorId === "front-observer-b").position = tile(40, 32);
      for (const [index, [x, y]] of [
        [27, 28],
        [28, 28],
        [29, 28],
        [30, 28],
        [28, 29],
        [29, 29]
      ].entries())
        actors.push(actor(`front-reinforcement-${index}`, melee(own), 2, x, y));
    }
  }
  if (id === "STRAT-11" && branch === "resource") {
    actors.find((entry) => entry.fixtureActorId === "own-source").position = tile(22, 24);
    actors.find((entry) => entry.fixtureActorId === "own-deposit").position = tile(32, 24);
  }
  if (id === "STRAT-11" && branch === "irrelevant")
    actors.find((entry) => entry.fixtureActorId === "scout-probe").position = tile(5, 5);
  if ((id === "SCOUT-03" && branch === "trapped") || (id === "FIGHT-05" && branch === "disconnected"))
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(28, 25);
  if (id === "SCOUT-03" && ["escape", "trapped"].includes(branch)) {
    // Exercise an actual scouting escape: the faction's fast flyer outruns the slower ranged
    // anti-air pursuer. Ground melee units move at the same pace and cannot leave its sight on
    // the open test map, making that setup an impossible escape premise. The paired trapped
    // branch uses the same start with a ground scout. Keep one second combatant home so the
    // scouting policy can commit its probe before the hidden contact is revealed.
    actors.push(actor("scout-guard", melee(own), 2, 35, 40));
    actors.find((entry) => entry.fixtureActorId === "scout-probe").actorName =
      branch === "escape" ? (own === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl") : melee(own);
    actors.find((entry) => entry.fixtureActorId === "contact-group").actorName = ranged(enemy);
    actors.find((entry) => entry.fixtureActorId === "scout-probe").position = tile(27, 35);
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(20, 35);
  }
  if (id === "PLACE-01" && branch === "constrained") {
    // Put the food-capable worker on the connected side of the terrain choke; its default spawn is
    // an isolated passable tile. Keep the one-tile base exit clear for service and transit probes.
    actors.find((entry) => entry.fixtureActorId === "worker-4").position = tile(36, 32);
    actors.find((entry) => entry.fixtureActorId === "worker-5").position = tile(35, 23);
    actors.find((entry) => entry.fixtureActorId === "worker-transit").position = tile(35, 30);
    actors.find((entry) => entry.fixtureActorId === "army-transit").position = tile(42, 27);
    actors.find((entry) => entry.fixtureActorId === "ready-granary").position = tile(38, 34);
  }
  if (id === "PLACE-01" && branch === "room") {
    // Keep the existing Field near its Granary and base-side approach.
    actors.push(actor("field-anchor", "Field", 2, 38, 30));
    actors.find((entry) => entry.fixtureActorId === "ready-producer").position = tile(45, 40);
    actors.find((entry) => entry.fixtureActorId === "ready-house").position = tile(40, 40);
    actors.find((entry) => entry.fixtureActorId === "ready-granary").position = tile(42, 34);
    for (let index = 0; index < 3; index++)
      actors.find((entry) => entry.fixtureActorId === `worker-${index}`).position = tile(
        45 + (index % 3),
        34 + Math.floor(index / 3)
      );
    actors.find((entry) => entry.fixtureActorId === "worker-0").position = tile(36, 30);
  }
}
