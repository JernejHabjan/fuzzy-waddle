import Phaser from "phaser";
import { MovementOccupancyService } from "./movement-occupancy.service";

describe("MovementOccupancyService air destinations", () => {
  function createService(): MovementOccupancyService {
    const scene = { events: { once: jest.fn() } } as unknown as Phaser.Scene;
    return new MovementOccupancyService(scene);
  }

  it("keeps air slots distinct only within the same flight layer", () => {
    const service = createService();

    expect(service.reserveAirDestination("flyer-a", { x: 3, y: 4 }, 0)).toBeDefined();
    expect(service.reserveAirDestination("flyer-b", { x: 3, y: 4 }, 0)).toBeUndefined();
    expect(service.reserveAirDestination("flyer-b", { x: 3, y: 4 }, 1)).toBeDefined();
  });

  it("releases slots when an order is replaced or an actor is removed", () => {
    const service = createService();

    service.reserveAirDestination("flyer-a", { x: 3, y: 4 }, 0);
    service.releaseAirDestination("flyer-a");
    expect(service.reserveAirDestination("flyer-b", { x: 3, y: 4 }, 0)).toBeDefined();

    service.releaseAll("flyer-b");
    expect(service.reserveAirDestination("flyer-c", { x: 3, y: 4 }, 0)).toBeDefined();
  });

  it("does not let an older movement release its replacement reservation", () => {
    const service = createService();
    const oldToken = service.reserveAirDestination("flyer-a", { x: 3, y: 4 }, 0)!;
    const replacementToken = service.reserveAirDestination("flyer-a", { x: 4, y: 4 }, 0)!;

    service.releaseAirDestination("flyer-a", oldToken);
    expect(service.reserveAirDestination("flyer-b", { x: 4, y: 4 }, 0)).toBeUndefined();

    service.releaseAirDestination("flyer-a", replacementToken);
    expect(service.reserveAirDestination("flyer-b", { x: 4, y: 4 }, 0)).toBeDefined();
  });
});
