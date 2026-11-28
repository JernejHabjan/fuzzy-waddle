import type { NativeActorLayoutContext } from "../../contracts/scenarios/native-actor-layout-context.ts";

/** Removes unrelated default actors while preserving each focused world's authored roster order. */
export function focusNativeScenarioRoster(context: NativeActorLayoutContext) {
  const { id, branch, actors, actor, own, melee } = context;
  if (id === "WALL-01") {
    const requiredRoles = new Set([
      ...Array.from({ length: 3 }, (_, index) => `worker-${index}`),
      "ready-house",
      "ready-granary",
      "own-deposit",
      "own-source",
      "army-0",
      "protected-deposit",
      "worker-transit",
      "army-transit",
      "fortification-house-1",
      "fortification-house-2",
      "ready-field-1",
      "ready-field-2",
      ...(branch === "no_value" ? [] : ["enemy-producer", "wall-approach-probe"])
    ]);
    return actors.filter((entry) => requiredRoles.has(entry.fixtureActorId));
  }
  if (id === "WALL-02") {
    const focusedRoles = new Set([
      "worker-0",
      "worker-1",
      "ready-producer",
      "ready-house",
      "housing-buffer-a",
      "housing-buffer-b",
      "own-deposit",
      "own-source",
      "ready-field-1",
      "ready-field-2",
      "ready-field-3",
      "ready-granary",
      "scout-probe",
      "frontier-scout-probe",
      "enemy-source",
      "perimeter-stair",
      "protected-deposit",
      "worker-transit",
      ...(["army", "concurrent"].includes(branch) ? ["army-transit"] : []),
      ...(branch === "enemy_opening" ? ["hostile-transit"] : [])
    ]);
    return actors.filter((entry) => focusedRoles.has(entry.fixtureActorId));
  }
  if (id === "FIGHT-01") {
    const fightRoles = new Set([
      "worker-0",
      "army-0",
      "army-1",
      "support-probe",
      "contact-group",
      "enemy-deposit",
      ...actors
        .filter((entry) => entry.fixtureActorId.startsWith("reinforcement-"))
        .map((entry) => entry.fixtureActorId)
    ]);
    return actors.filter((entry) => fightRoles.has(entry.fixtureActorId));
  }
  if (id === "SCOUT-04") {
    if (branch !== "approach") {
      actors.push(actor("scout-reserve", melee(own), 2, 34, 16));
      actors.push(actor("scout-reserve-2", melee(own), 2, 35, 16));
    }
    const distractions = new Set([
      "ready-producer",
      "ranged-probe",
      "support-probe",
      "front-target-a",
      "front-target-b",
      "noise-scout",
      "enemy-producer",
      "enemy-deposit",
      "enemy-source",
      "enemy-worker"
    ]);
    return actors.filter((entry) => !distractions.has(entry.fixtureActorId));
  }
  if (id === "SCOUT-03") {
    const roles = new Set(["scout-probe", "scout-guard", "contact-group", "ready-house", "worker-0", "worker-1"]);
    return actors.filter((entry) => roles.has(entry.fixtureActorId));
  }
  if (["SCOUT-01", "SCOUT-03"].includes(id)) {
    // Keep the scout, native base prerequisites and both scouting approaches. The extra combat probes
    // and duplicate enemy producers belong to the broader battle setups.
    const extraRoles = new Set([
      "ranged-probe",
      "support-probe",
      "front-target-a",
      "front-target-b",
      "noise-scout",
      ...(id === "SCOUT-01" ? ["enemy-producer"] : [])
    ]);
    return actors.filter((entry) => !extraRoles.has(entry.fixtureActorId));
  }
  if (id === "PLACE-01") {
    // This recipe measures multiple fields and service. Keep only the workforce that creates
    // that dated food demand plus the route probes;
    // the shared battle/economy roster otherwise grows into unrelated army and construction work.
    const roles = new Set([
      ...Array.from({ length: 6 }, (_, index) => `worker-${index}`),
      "ready-producer",
      "ready-house",
      "ready-granary",
      ...(branch === "room" ? ["field-anchor"] : []),
      "own-deposit",
      "own-source",
      "worker-transit",
      "army-transit"
    ]);
    return actors.filter((entry) => roles.has(entry.fixtureActorId));
  }
  if (id === "PLACE-03") {
    const roles = new Set([
      "worker-0",
      "worker-1",
      "worker-2",
      "worker-3",
      "ready-producer",
      "ready-house",
      "own-deposit",
      "own-source",
      "ready-granary",
      "scout-probe",
      "worker-transit",
      "army-transit",
      ...(branch === "loss" ? ["perimeter-wall"] : []),
      ...(branch === "layout" ? ["ready-field-1", "ready-field-2", "ready-field-3"] : [])
    ]);
    return actors.filter((entry) => roles.has(entry.fixtureActorId));
  }
  if (id === "STRAT-05") {
    const roles = new Set([
      "worker-0",
      ...Array.from({ length: 8 }, (_, index) => `army-${index}`),
      "contact-group",
      "front-target-a",
      "front-target-b",
      ...Array.from({ length: 12 }, (_, index) => `reinforcement-${index}`)
    ]);
    return actors.filter((entry) => roles.has(entry.fixtureActorId));
  }
  return actors;
}
