import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import { AirDestinationReservationStore } from "./air-destination-reservation-store";

describe("AirDestinationReservationStore", () => {
  it("separates flight layers and rejects occupied rally slots on the same layer", () => {
    const store = new AirDestinationReservationStore();
    const tile = { x: 2, y: 3 };

    expect(store.reserve("low" as ActorId, tile, 20)).toBeDefined();
    expect(store.reserve("blocked" as ActorId, tile, 20)).toBeUndefined();
    expect(store.reserve("high" as ActorId, tile, 40)).toBeDefined();
  });

  it("does not let an older movement release its replacement reservation", () => {
    const store = new AirDestinationReservationStore();
    const actorId = "flyer" as ActorId;
    const oldToken = store.reserve(actorId, { x: 1, y: 1 }, 20)!;
    const newToken = store.reserve(actorId, { x: 2, y: 2 }, 20)!;

    store.release(actorId, oldToken);
    expect(store.getReservedTiles(20)).toEqual([{ x: 2, y: 2 }]);

    store.release(actorId, newToken);
    expect(store.getReservedTiles(20)).toEqual([]);
  });

  it("ignores existing reservations owned by the same simultaneous group", () => {
    const store = new AirDestinationReservationStore();
    const first = "flyer-a" as ActorId;
    const second = "flyer-b" as ActorId;
    const tile = { x: 5, y: 5 };
    store.reserve(first, tile, 20);

    expect(store.reserve(second, tile, 20, [first, second])).toBeDefined();
  });
});
