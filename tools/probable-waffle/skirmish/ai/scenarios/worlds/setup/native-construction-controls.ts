import type { NativeWorldSetupContext } from "../../../contracts/scenarios/native-world-setup-context.ts";
import { tile } from "../native-world-geometry.ts";

/** Applies the original family controls before the runtime validates and seals the preset. */
export function configureNativeConstructionControls(context: NativeWorldSetupContext): void {
  const { id, branch, world, actors, move, attack, loss } = context;

  if (id.startsWith("PLACE-") || id.startsWith("WALL-") || ["H-27", "H-28"].includes(id)) {
    const layoutRetreat = id === "PLACE-03" && branch === "layout";
    world.protectedRoutes = [
      {
        id: "worker-service",
        playerNumber: 2,
        from: tile(
          id.startsWith("WALL-") || ["H-27", "H-28"].includes(id) ? 33 : 32,
          id.startsWith("WALL-") || ["H-27", "H-28"].includes(id) ? 24 : 23
        ),
        to: tile(28, 31),
        tileMargin: 0
      },
      {
        id: id === "PLACE-03" && branch === "completion" ? "army-transit" : "production-army",
        playerNumber: 2,
        from: id === "PLACE-03" && branch === "completion" ? tile(27, 25) : tile(42, 25),
        to: id === "PLACE-03" && branch === "completion" ? tile(28, 25) : tile(27, 25),
        tileMargin: ["PLACE-01", "PLACE-03"].includes(id) ? 0 : 1
      },
      {
        id: "retreat",
        playerNumber: 2,
        from: layoutRetreat ? tile(28, 28) : tile(28, 25),
        to: layoutRetreat ? tile(33, 28) : tile(33, 25),
        tileMargin: ["PLACE-01", "PLACE-03"].includes(id) ? 0 : 1
      }
    ];
    const earlyTransitProbe = ["PLACE-01", "PLACE-03", "WALL-01"].includes(id);
    const transitTicks = earlyTransitProbe ? [1] : [200, 600, 1000, 1400, 1800, 2200];
    for (const [index, tick] of transitTicks.entries()) {
      if (earlyTransitProbe) {
        // These short, on-route probes must finish before the AI's next order refresh.
        move("worker-transit", tick, 29, 30);
        move("army-transit", tick, 28, branch === "concurrent" ? 24 : 25);
      } else {
        move("worker-transit", tick, index % 2 ? 28 : 32, index % 2 ? 31 : 23);
        move("army-transit", tick, index % 2 ? 27 : 42, 25);
      }
    }
    if (["WALL-02", "H-27"].includes(id) || ["exposed", "both_exposed"].includes(branch))
      attack("contact-group", "original-home", id === "H-27" ? 20 : 200);
    if (["stairs_loss", "stairs_missing", "breach", "unreachable", "loss"].includes(branch))
      loss(
        ["breach", "repair", "loss", "changed_plan"].includes(branch) ? "perimeter-wall" : "perimeter-stair",
        branch === "stairs_missing" ? 1 : 400
      );
    if (id === "H-28" && ["changed_plan", "repair"].includes(branch))
      world.events.push({
        id: "loss-ai-wall",
        tick: 1200,
        kind: "destroy_ai_site",
        owner: 2,
        objectName: "Wall"
      });
    if (id === "WALL-04" && branch === "unreachable")
      world.controls.push({
        id: "block-stair-repair",
        producerFixtureActorId: "enemy-worker",
        requestTick: 500,
        applicationTick: 500,
        action: { kind: "construct", actorName: "Wall", worldPosition: tile(29, 22) }
      });
    if (branch === "no_value") loss("protected-deposit", 200);
    if (branch === "air") attack("air-threat", "original-home", 200);
    if (id === "WALL-05" && branch === "shore") {
      world.protectedRoutes.push({
        id: "shore-egress",
        playerNumber: 2,
        from: tile(26, 26),
        to: tile(30, 28),
        tileMargin: 0
      });
      world.controls.push({
        id: "shore-egress",
        producerFixtureActorId: "shore-transit",
        requestTick: 200,
        applicationTick: 200,
        action: { kind: "move", worldPosition: tile(30, 28) }
      });
    }
    if (branch === "unaffordable")
      world.resourceStarts.find((start) => start.playerNumber === 2).amounts = {
        food: 0,
        wood: 0,
        stone: 0,
        minerals: 0
      };
  }
  if (id === "STRAT-11" && branch === "resource")
    world.initialOrders.push({ workerFixtureActorId: "worker-0", sourceFixtureActorId: "own-source", kind: "gather" });
  if (id === "PLACE-01" && branch === "constrained") {
    world.terrainPreserveFootprints = true;
    world.protectedRoutes[0] = {
      id: "worker-service",
      playerNumber: 2,
      from: tile(32, 23),
      to: tile(34, 30),
      tileMargin: 0
    };
    for (const control of world.controls)
      if (
        control.producerFixtureActorId === "worker-transit" &&
        control.action.kind === "move" &&
        control.action.worldPosition.x === tile(28, 31).x
      )
        control.action.worldPosition = tile(34, 30);
  }
  if (
    !id.startsWith("PLACE-") &&
    id !== "H-28" &&
    !["unused", "protected"].includes(branch) &&
    !world.constructionOrders?.length &&
    actors.has("enemy-worker")
  )
    world.initialOrders.push({
      workerFixtureActorId: "enemy-worker",
      sourceFixtureActorId: "enemy-source",
      kind: "gather"
    });
}
