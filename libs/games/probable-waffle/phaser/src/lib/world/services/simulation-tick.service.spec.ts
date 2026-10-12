import Phaser from "phaser";
import { SimulationPauseReason, SimulationTickService } from "./simulation-tick.service";

describe("SimulationTickService campaign cinematic pause ownership", () => {
  it("removes only the cinematic pause reason when presentation completes", () => {
    const scene = {
      events: { on: jest.fn(), once: jest.fn() }
    } as unknown as Phaser.Scene;
    const service = new SimulationTickService(scene);

    service.pauseTick(SimulationPauseReason.Player);
    service.pauseTick(SimulationPauseReason.CampaignCinematic);
    expect(service.getPauseReasons()).toEqual([SimulationPauseReason.CampaignCinematic, SimulationPauseReason.Player]);

    service.resumeTick(SimulationPauseReason.CampaignCinematic);
    expect(service.isPaused).toBe(true);
    expect(service.getPauseReasons()).toEqual([SimulationPauseReason.Player]);
  });
});

describe("SimulationTickService passive closed frontiers", () => {
  function setup() {
    const events = new Phaser.Events.EventEmitter();
    const scene = { events } as unknown as Phaser.Scene;
    return { events, service: new SimulationTickService(scene) };
  }

  it("runs after increment and before all next-tick subscribers, including multi-tick render frames", () => {
    const { service, events } = setup();
    const order: string[] = [];
    const detach = service.observeClosedFrontiers(
      (tick) => order.push(`closed:${tick - 1}:${service.currentTick}`),
      jest.fn()
    );
    service.tick$.subscribe((tick) => order.push(`tick:${tick}`));
    events.emit(Phaser.Scenes.Events.UPDATE, 0, 100);
    expect(order).toEqual(["closed:0:1", "tick:1", "closed:1:2", "tick:2"]);
    detach();
    events.emit(Phaser.Scenes.Events.UPDATE, 0, 50);
    expect(order.at(-1)).toBe("tick:3");
  });

  it("detaches a throwing observer and its throwing error handler without stopping ticks", () => {
    const { service, events } = setup();
    const close = jest.fn(() => {
      throw new Error("observer");
    });
    service.observeClosedFrontiers(close, () => {
      throw new Error("handler");
    });
    events.emit(Phaser.Scenes.Events.UPDATE, 0, 100);
    expect(service.currentTick).toBe(2);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("fences fast-forward and shutdown, and refuses competing observers", () => {
    const { service, events } = setup();
    const lost = jest.fn();
    service.observeClosedFrontiers(jest.fn(), lost);
    expect(() => service.observeClosedFrontiers(jest.fn(), jest.fn())).toThrow("already_installed");
    service.fastForwardTo(20);
    expect(lost).toHaveBeenCalledWith("simulation_clock_fast_forward");
    service.observeClosedFrontiers(jest.fn(), lost);
    events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(lost).toHaveBeenCalledWith("simulation_clock_shutdown");
  });
});
