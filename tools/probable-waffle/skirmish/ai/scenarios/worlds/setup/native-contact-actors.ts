import type { NativeActorLayoutContext } from "../../../contracts/scenarios/native-actor-layout-context.ts";

/** Applies the original family controls before the runtime validates and seals the preset. */
export function configureNativeContactActors(context: NativeActorLayoutContext): void {
  const { id, branch, actors, tile } = context;

  if (id === "SCOUT-02") {
    // Keep the opening contact in scout vision without starting the probe inside its
    // attack radius; this case measures stale information service after withdrawal.
    // Start the designated scout in the same connected access region as the oldest search point,
    // while keeping its opening vision on the contact and outside melee range.
    actors.find((entry) => entry.fixtureActorId === "scout-probe").position = tile(44, 7);
    // Keep the ranged and support members out of auto-defense range so the contact can withdraw
    // before it becomes a combat target; otherwise their opening attack cancels the move control.
    actors.find((entry) => entry.fixtureActorId === "ranged-probe").position = tile(42, 5);
    actors.find((entry) => entry.fixtureActorId === "support-probe").position = tile(44, 5);
    // Keep first contact visible but outside the home-defense radius so stale scouting is not
    // converted into an opening base-defense response.
    actors.find((entry) => entry.fixtureActorId === "contact-group").position = tile(45, 20);
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
      if (position) entry.position = tile(position[0], position[1]);
    }
  }
}
