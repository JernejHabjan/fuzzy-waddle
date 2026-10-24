import { ProductionComponent } from "./production-component";
import { spawnProductionActor } from "./production-spawner";
import type { ProductionQueueItem } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/game-object";

jest.mock("./production-spawner", () => ({ spawnProductionActor: jest.fn(() => "native-output") }));

describe("retained paid completion lifecycle fence", () => {
  beforeEach(() => jest.clearAllMocks());

  function owner(disposed: boolean, actorActive: boolean, sceneActive: boolean): ProductionComponent {
    // Exercise the original completion method after its native owner becomes unavailable, without creating another queue.
    return Object.assign(Object.create(ProductionComponent.prototype) as ProductionComponent, {
      disposed,
      gameObject: { active: actorActive, scene: { sys: { isActive: () => sceneActive } } }
    });
  }

  it.each([[true, true, true], [false, false, true], [false, true, false]])(
    "rejects a retained completion for disposed=%s actorActive=%s sceneActive=%s",
    (disposed, actorActive, sceneActive) => {
      expect(owner(disposed, actorActive, sceneActive).handleProductionComplete({} as ProductionQueueItem)).toBeNull();
      expect(spawnProductionActor).not.toHaveBeenCalled();
    }
  );

  it("keeps the actual live spawn owner responsible for completion", () => {
    expect(owner(false, true, true).handleProductionComplete({} as ProductionQueueItem)).toBe("native-output");
    expect(spawnProductionActor).toHaveBeenCalledTimes(1);
  });
});
