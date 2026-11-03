import type { NativeActorLayoutContext } from "../../../contracts/scenarios/native-actor-layout-context.ts";

/** Applies the original family controls before the runtime validates and seals the preset. */
export function configureNativeObjectiveActors(context: NativeActorLayoutContext): void {
  const { id, own, enemy, branch, actors, tile, actor, melee, ranged } = context;

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
}
