import type { NativeWorldSetupContext } from "../../../contracts/scenarios/native-world-setup-context.ts";
import { tile } from "../native-world-geometry.ts";

/** Keeps independent transit probes active across the authored layout and completion boundaries. */
export function configureNativePlacementTransit(context: NativeWorldSetupContext): void {
  const { branch, world, actors, move, own, enemy } = context;
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
