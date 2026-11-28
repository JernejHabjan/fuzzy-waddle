import type { NativeWorldSetupContext } from "../../../contracts/scenarios/native-world-setup-context.ts";
import { tile } from "../native-world-geometry.ts";

/** Authors the protected paths and initial probe positions before transit controls are appended. */
export function configureNativeConstructionRoutes(context: NativeWorldSetupContext): void {
  const { id, branch, world, actors, own } = context;
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
}
