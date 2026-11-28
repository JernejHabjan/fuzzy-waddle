import type { NativeScenarioActor } from "../../../contracts/scenarios/native-scenario-actor.ts";
import type { NativeActorLayoutContext } from "../../../contracts/scenarios/native-actor-layout-context.ts";

/** Applies the original family controls before the runtime validates and seals the preset. */
export function configureNativeCombatActors(context: NativeActorLayoutContext): NativeScenarioActor[] | undefined {
  const { id, own, enemy, branch, actors, tile, actor, melee, ranged, producer, caster } = context;

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
  if (id === "FIGHT-05" && ["stun", "slow"].includes(branch))
    actors.push(actor("enemy-research", producer(enemy), 1, 12, 22), actor("enemy-caster", caster(enemy), 1, 26, 27));
  if (["STRAT-07", "RAID-01"].includes(id) && branch !== "unfinished") {
    actors.find((entry) => entry.fixtureActorId === "enemy-worker").position = tile(23, 27);
    actors.find((entry) => entry.fixtureActorId === "enemy-source").position = tile(22, 28);
    actors.find((entry) => entry.fixtureActorId === "enemy-deposit").position = tile(12, 36);
  }
  if (id === "RAID-01" && branch === "workers") {
    // Keep the worker's proven WorkMill service route intact and give the limited raid one
    // ranged actor; melee-only attacks against this moving worker can begin outside valid range.
    actors.find((entry) => entry.fixtureActorId === "army-4").actorName = ranged(own);
  }
  if (id === "RAID-01" && branch === "expansion") {
    // Keep a passive decoy near the enemy base so a combat contact cannot divert the remote-expansion raid.
    actors.find((entry) => entry.fixtureActorId === "contact-group").actorName = "Wall";
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(12, 20);
    actors.find((entry) => entry.fixtureActorId === "enemy-worker").position = tile(14, 38);
    actors.find((entry) => entry.fixtureActorId === "enemy-source").position = tile(14, 41);
    actors.find((entry) => entry.fixtureActorId === "noise-scout").actorName = melee(enemy);
  }
  if (id === "RAID-01" && branch === "unfinished") {
    // Keep the seeded producer's footprint clear while its real builder remains adjacent.
    actors.find((entry) => entry.fixtureActorId === "enemy-deposit").position = tile(12, 36);
  }
}
