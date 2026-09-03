import Phaser from "phaser";
import { MovementOccupancyService } from "./movement-occupancy.service";

describe("MovementOccupancyService air destinations", () => {
  function createService(): MovementOccupancyService {
    const scene = { events: { once: jest.fn() } } as unknown as Phaser.Scene;
    return new MovementOccupancyService(scene);
  }

  it("keeps air slots distinct only within the same flight layer", () => {
    const service = createService();

    expect(service.reserveAirDestination("flyer-a", { x: 3, y: 4 }, 0)).toBe(true);
    expect(service.reserveAirDestination("flyer-b", { x: 3, y: 4 }, 0)).toBe(false);
    expect(service.reserveAirDestination("flyer-b", { x: 3, y: 4 }, 1)).toBe(true);
  });

  it("releases slots when an order is replaced or an actor is removed", () => {
    const service = createService();

    service.reserveAirDestination("flyer-a", { x: 3, y: 4 }, 0);
    service.releaseAirDestination("flyer-a");
    expect(service.reserveAirDestination("flyer-b", { x: 3, y: 4 }, 0)).toBe(true);

    service.releaseAll("flyer-b");
    expect(service.reserveAirDestination("flyer-c", { x: 3, y: 4 }, 0)).toBe(true);
  });
});
