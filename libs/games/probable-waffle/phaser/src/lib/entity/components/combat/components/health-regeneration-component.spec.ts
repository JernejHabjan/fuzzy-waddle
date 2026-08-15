import type Phaser from "phaser";
import { Subject } from "rxjs";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../../world/services/simulation-tick.service";
import { HealthComponent } from "./health-component";
import { HealthRegenerationComponent } from "./health-regeneration-component";

jest.mock("../../../../data/game-object-helper", () => ({
  onObjectReady: (_gameObject: unknown, callback: () => void, scope: unknown) => callback.call(scope)
}));

jest.mock("../../../../world/services/scene-component-helpers", () => ({
  getSceneService: jest.fn()
}));

describe("HealthRegenerationComponent", () => {
  let tick$: Subject<number>;
  const healthComponent = {
    isDamaged: true,
    healthDefinition: { regenerateHealthRate: 4 },
    heal: jest.fn()
  };
  const eventHandlers = new Map<string, () => void>();
  const gameObject = {
    scene: {},
    getData: jest.fn(() => ({ components: new Map([[HealthComponent, healthComponent]]) })),
    once: jest.fn((event: string, callback: () => void, scope: unknown) => {
      eventHandlers.set(event, () => callback.call(scope));
    })
  };
  const actor = gameObject as unknown as Phaser.GameObjects.GameObject;

  beforeEach(() => {
    jest.clearAllMocks();
    tick$ = new Subject<number>();
    eventHandlers.clear();
    healthComponent.isDamaged = true;
    healthComponent.healthDefinition.regenerateHealthRate = 4;
    (getSceneService as jest.Mock).mockReturnValue({ tick$ } satisfies Partial<SimulationTickService>);
  });

  it("heals the actor once per deterministic simulation second", () => {
    new HealthRegenerationComponent(actor);

    tick$.next(19);
    tick$.next(20);
    tick$.next(21);
    healthComponent.healthDefinition.regenerateHealthRate = 6;
    tick$.next(40);

    expect(healthComponent.heal).toHaveBeenCalledTimes(2);
    expect(healthComponent.heal).toHaveBeenNthCalledWith(1, 4);
    expect(healthComponent.heal).toHaveBeenNthCalledWith(2, 6);
  });

  it("does not regenerate actors that cannot currently be healed", () => {
    healthComponent.isDamaged = false;
    new HealthRegenerationComponent(actor);

    tick$.next(20);

    expect(healthComponent.heal).not.toHaveBeenCalled();
  });

  it("stops regenerating when the actor is killed", () => {
    new HealthRegenerationComponent(actor);

    eventHandlers.get(HealthComponent.KilledEvent)?.();
    tick$.next(20);

    expect(healthComponent.heal).not.toHaveBeenCalled();
  });
});
