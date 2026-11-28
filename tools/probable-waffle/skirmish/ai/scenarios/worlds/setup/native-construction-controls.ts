import type { NativeWorldSetupContext } from "../../../contracts/scenarios/native-world-setup-context.ts";
import { tile } from "../native-world-geometry.ts";

/** Applies the original family controls before the runtime validates and seals the preset. */
export function configureNativeConstructionControls(context: NativeWorldSetupContext): void {
  const { id, branch, world, actors, move, attack, loss, own, enemy } = context;

  if (id === "PLACE-02") return;
  if (id.startsWith("PLACE-") || id.startsWith("WALL-") || ["H-27", "H-28"].includes(id)) {
    const layoutRetreat = id === "PLACE-03" && branch === "layout";
    const wall02OpeningTransit = id === "WALL-02";
    const wall02RouteRow = own === "Tivara" ? (branch === "worker" ? 22 : branch === "enemy_opening" ? 19 : 18) : 19;
    world.protectedRoutes = [
      {
        id: "worker-service",
        playerNumber: 2,
        from: tile(
          id.startsWith("WALL-") || ["H-27", "H-28"].includes(id) ? 33 : 32,
          id.startsWith("WALL-") || ["H-27", "H-28"].includes(id) ? 24 : 23
        ),
        to: tile(id === "PLACE-03" ? 29 : 28, 31),
        tileMargin: 0
      },
      {
        id: id === "PLACE-03" && branch === "completion" ? "army-transit" : "production-army",
        playerNumber: 2,
        from:
          id === "PLACE-03" && branch === "completion"
            ? tile(27, 25)
            : wall02OpeningTransit
              ? tile(30, 21)
              : tile(42, 25),
        to:
          id === "PLACE-03" && branch === "completion"
            ? tile(28, 25)
            : wall02OpeningTransit
              ? tile(26, 21)
              : tile(27, 25),
        tileMargin: ["PLACE-01", "PLACE-03"].includes(id) ? 0 : 1
      },
      {
        id: "retreat",
        playerNumber: 2,
        from: layoutRetreat ? tile(28, 28) : wall02OpeningTransit ? tile(26, 21) : tile(28, 25),
        to: layoutRetreat ? tile(33, 28) : wall02OpeningTransit ? tile(30, 21) : tile(33, 25),
        tileMargin: ["PLACE-01", "PLACE-03"].includes(id) ? 0 : 1
      }
    ];
    if (wall02OpeningTransit) {
      const homeSide = tile(30, wall02RouteRow),
        exteriorSide = tile(26, wall02RouteRow);
      world.protectedRoutes[0] = {
        id: "worker-service",
        playerNumber: 2,
        from: homeSide,
        to: exteriorSide,
        tileMargin: 0
      };
      world.protectedRoutes[1] = {
        id: "production-army",
        playerNumber: 2,
        from: homeSide,
        to: exteriorSide,
        tileMargin: 1
      };
      world.protectedRoutes[2] = {
        id: "retreat",
        playerNumber: 2,
        from: exteriorSide,
        to: homeSide,
        tileMargin: 1
      };
    }
    if (id === "WALL-01") {
      // Native front selection is faction/terrain-sensitive by one tile. Bind the protected
      // route to the opening the planner will actually build so the route proof crosses it.
      const openingRow = 20;
      const routeOpening = branch === "freestanding" ? { x: 38, y: 20 } : { x: 37, y: openingRow };
      const routeStartX = routeOpening.x;
      const routeEndX = routeOpening.x + 2;
      world.protectedRoutes = [
        { id: "worker-service", playerNumber: 2, from: tile(28, 31), to: tile(29, 30), tileMargin: 0 },
        {
          id: "production-army",
          playerNumber: 2,
          from: tile(routeStartX, routeOpening.y),
          to: tile(routeEndX, routeOpening.y),
          tileMargin: 0
        },
        {
          id: "retreat",
          playerNumber: 2,
          from: tile(routeEndX, routeOpening.y),
          to: tile(routeStartX, routeOpening.y),
          tileMargin: 0
        }
      ];
      actors.get("army-transit").position =
        branch === "freestanding" ? tile(routeStartX - 1, routeOpening.y - 1) : tile(routeStartX, routeOpening.y);
    }
    if (id === "PLACE-01" && branch === "room") {
      // This case proves useful Field placement; keep its short transit probes on a separate
      // lane so the placement proof doesn't also impose PLACE-03's central-route constraint.
      world.protectedRoutes[0] = {
        id: "worker-service",
        playerNumber: 2,
        from: tile(42, 28),
        to: tile(43, 28),
        tileMargin: 0
      };
      world.protectedRoutes[1] = {
        id: "production-army",
        playerNumber: 2,
        from: tile(42, 25),
        to: tile(41, 25),
        tileMargin: 0
      };
      world.protectedRoutes[2] = {
        id: "retreat",
        playerNumber: 2,
        from: tile(41, 25),
        to: tile(42, 25),
        tileMargin: 0
      };
      actors.get("worker-transit").position = tile(42, 28);
      actors.get("army-transit").position = tile(42, 25);
    }
    const earlyTransitProbe = ["PLACE-01", "WALL-01"].includes(id);
    const wall01OpeningRow = 20;
    const wall01RouteOpening = branch === "freestanding" ? { x: 38, y: 20 } : { x: 37, y: wall01OpeningRow };
    const wall01Opening = branch === "freestanding" ? { x: 38, y: 22 } : { x: 37, y: wall01OpeningRow };
    const wall01RouteEndX = wall01RouteOpening.x + 2;
    const wall02TransitTick = own === "Tivara" ? (branch === "worker" ? 1221 : 761) : 681;
    const transitTicks =
      id === "PLACE-03"
        ? []
        : earlyTransitProbe
          ? [1]
          : wall02OpeningTransit
            ? branch === "army"
              ? [wall02TransitTick]
              : branch === "concurrent"
                ? [wall02TransitTick]
                : branch === "worker"
                  ? [wall02TransitTick]
                  : []
            : [200, 600, 1000, 1400, 1800, 2200];
    for (const [index, tick] of transitTicks.entries()) {
      if (earlyTransitProbe) {
        // These short, on-route probes must finish before the AI's next order refresh.
        if (id === "PLACE-01" && branch === "constrained") {
          move("worker-transit", tick, 35, 27);
          move("army-transit", tick, 40, 27);
        } else if (id === "PLACE-01" && branch === "room") {
          move("worker-transit", tick, 43, 28);
          move("army-transit", tick, 41, 25);
        } else move("worker-transit", tick, 29, 30);
        if (id === "WALL-01") move("army-transit", tick, wall01RouteEndX, wall01RouteOpening.y);
        else if (!(id === "PLACE-01" && ["constrained", "room"].includes(branch)))
          move("army-transit", tick, 28, branch === "concurrent" ? 24 : 25);
      } else {
        if (wall02OpeningTransit) {
          // Cross the real worker after the first paid stair prefix; army-width clearance is
          // checked from the native route sample at every construction prefix.
          const crossing = { homeX: 30, outsideX: 26, y: wall02RouteRow };
          if (["worker", "army", "concurrent"].includes(branch) && tick === wall02TransitTick)
            move("worker-transit", tick, crossing.outsideX, crossing.y);
        } else {
          move("worker-transit", tick, index % 2 ? 28 : 32, index % 2 ? 31 : 23);
          move("army-transit", tick, index % 2 ? 27 : 42, 25);
        }
      }
    }
    if (id === "WALL-01" && branch !== "no_value") {
      // Keep the probe on a remote air approach until the full native line is ready, then
      // cross the exterior opening and test whether the finished tower intercepts the attack.
      const approach =
        own === "Tivara"
          ? branch === "terrain"
            ? { move: 800, attack: 1120 }
            : { move: 1100, attack: 1360 }
          : branch === "terrain"
            ? { move: 650, attack: 970 }
            : { move: 1030, attack: 1240 };
      for (let tick = 1; tick < approach.move; tick += 150) move("wall-approach-probe", tick, 49, 5);
      move("wall-approach-probe", approach.move, wall01Opening.x + 2, wall01Opening.y);
      attack("wall-approach-probe", "protected-deposit", approach.attack);
    }
    if (id === "PLACE-03") {
      actors.get("worker-transit").owner = 1;
      actors.get("worker-transit").actorName = `${enemy}WorkerMale`;
      actors.get("army-transit").owner = 1;
      actors.get("army-transit").actorName = enemy === "Tivara" ? "TivaraMacemanMale" : "SkaduweeWarriorMale";
      if (branch === "layout") {
        const routeTicks = own === "Skaduwee" ? [10, 315, 435, 635, 1115] : [10, 115, 315, 635, 1115];
        for (const tick of routeTicks) move("scout-probe", tick, 45, 29);
      } else {
        const earlyBuilds = own === "Skaduwee",
          routeOrders = earlyBuilds
            ? branch === "concurrent"
              ? [
                  { tick: 10, x: 27, y: 25 },
                  { tick: 50, x: 27, y: 25 }
                ]
              : branch === "completion"
                ? [
                    { tick: 10, x: 33, y: 25 },
                    { tick: 50, x: 28, y: 25 },
                    { tick: 110, x: 33, y: 25 }
                  ]
                : [
                    { tick: 10, x: 27, y: 25 },
                    { tick: 50, x: 42, y: 25 },
                    { tick: 110, x: 27, y: 25 }
                  ]
            : branch === "completion"
              ? [
                  { tick: 115, x: 33, y: 25 },
                  { tick: 315, x: 28, y: 25 }
                ]
              : [
                  { tick: 115, x: 27, y: 25 },
                  { tick: 315, x: 42, y: 25 }
                ];
        for (const target of routeOrders) move("scout-probe", target.tick, target.x, target.y);
      }
      if (branch === "layout") {
        // Human-owned probes keep the native post-layout crossing independent from the AI's
        // legitimate scouting and worker reassignment during this focused placement scenario.
        world.protectedRoutes[0] = {
          id: "worker-service",
          playerNumber: 2,
          from: tile(21, 31),
          to: tile(45, 29),
          tileMargin: 0
        };
        world.protectedRoutes[1] = {
          id: "production-army",
          playerNumber: 2,
          from: tile(17, 14),
          to: tile(41, 25),
          tileMargin: 0
        };
        world.protectedRoutes[2] = {
          id: "retreat",
          playerNumber: 2,
          from: tile(41, 25),
          to: tile(16, 13),
          tileMargin: 0
        };
        actors.get("worker-transit").position = tile(20, 30);
        actors.get("army-transit").position = tile(16, 13);
      } else {
        actors.get("worker-transit").position = tile(25, 42);
        actors.get("army-transit").position = tile(24, 40);
      }
      const crossings = [
        { role: "worker-transit", route: world.protectedRoutes[0] },
        { role: "army-transit", route: world.protectedRoutes[1] }
      ];
      if (["layout", "concurrent"].includes(branch)) {
        for (const { role, route } of crossings.filter(({ role }) => role === "worker-transit"))
          world.controls.push({
            id: "post-layout-cross-" + role,
            producerFixtureActorId: role,
            requestTick: branch === "layout" ? (own === "Skaduwee" ? 500 : 1400) : 1470,
            applicationTick: branch === "layout" ? (own === "Skaduwee" ? 500 : 1400) : 1470,
            action: { kind: "move", worldPosition: { ...route.to, z: route.to.z ?? 0 } }
          });
      } else {
        for (const { role, route } of crossings)
          world.controls.push({
            id: "post-layout-cross-" + role,
            producerFixtureActorId: role,
            requestTick: role === "worker-transit" ? 1470 : 1505,
            applicationTick: role === "worker-transit" ? 1470 : 1505,
            action: { kind: "move", worldPosition: { ...route.to, z: route.to.z ?? 0 } }
          });
      }
    }
    if (id === "H-27") attack("contact-group", "original-home", 20);
    if (id === "WALL-02" && branch === "enemy_opening") {
      // Stage a real hostile at the enemy-side end of the intentional opening before the
      // first wall prefix, then preserve the opening in the paid fortification plan.
      move("hostile-transit", 200, 26, wall02RouteRow);
      attack("hostile-transit", "protected-deposit", 260);
    }
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
      from: tile(35, 30),
      to: tile(35, 27),
      tileMargin: 0
    };
    world.protectedRoutes[1] = {
      id: "production-army",
      playerNumber: 2,
      from: tile(42, 27),
      to: tile(40, 27),
      tileMargin: 0
    };
    world.protectedRoutes[2] = {
      id: "retreat",
      playerNumber: 2,
      from: tile(40, 27),
      to: tile(38, 27),
      tileMargin: 0
    };
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
