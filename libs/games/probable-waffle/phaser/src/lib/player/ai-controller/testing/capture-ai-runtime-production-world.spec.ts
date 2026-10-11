import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { ObjectNames, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import { getActorComponent } from "../../../data/actor-component";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { ResearchComponent } from "../../../entity/components/research/research-component";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import { productionCaptureFixture } from "./ai-runtime-production-capture-fixtures";
import { captureAiRuntimeProductionWorld } from "./capture-ai-runtime-production-world";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ getPlayer: jest.fn(), isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({
  getSceneService: jest.fn(),
  getSceneSystem: jest.fn()
}));
jest.mock("../../../prefabs/definitions/actor-definitions", () => ({
  getPwActorDefinition: jest.fn(),
  pwActorDefinitions: {}
}));

/** Synthetic component/index authorities only; these assertions do not establish a real Phaser setup. */
function worldFixture() {
  const fixture = productionCaptureFixture();
  const previous = jest.mocked(getActorComponent).getMockImplementation();
  if (!previous) throw new Error("synthetic_component_authority_missing");
  jest.mocked(getActorComponent).mockImplementation((actor, component) => {
    if (component === ProductionComponent)
      return {
        productionDefinition: { availableProduceActors: [ObjectNames.TivaraWorker] }
      } as never;
    if (component === ResearchComponent)
      return { availableResearch: [ResearchType.TivaraMacemanUpgradeLevel2] } as never;
    if (component === ConstructionSiteComponent) return { isFinished: false } as never;
    return previous(actor, component);
  });
  const service = jest.mocked(getSceneService).getMockImplementation();
  if (!service) throw new Error("synthetic_scene_authority_missing");
  jest
    .mocked(getSceneService)
    .mockImplementation((scene, owner) =>
      owner === TechTreeService ? ({ getResearchedLevelForUnit: () => 2 } as never) : service(scene, owner)
    );
  jest.mocked(getPwActorDefinition).mockImplementation((_name, level) => ({
    components: {
      productionCost: {
        costType: PaymentType.PayImmediately,
        productionTime: level === null ? 125 : 50,
        resources: { food: level === null ? 35 : 999 },
        refundFactor: 0.5
      }
    }
  }));
  jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
  return fixture;
}

describe("captureAiRuntimeProductionWorld", () => {
  it("captures actual unfinished actor and base command price separately from researched product level/research price", () => {
    const f = worldFixture();
    const world = captureAiRuntimeProductionWorld(f.scene, 2, [f.actor]);
    expect(world.gaps).toEqual([]);
    expect(requireAiTestEntry(world.actors, 0)).toMatchObject({
      actorId: "producer",
      finished: false,
      currentLevel: 1
    });
    expect(requireAiTestEntry(world.catalog, 0)).toMatchObject({
      productKey: ObjectNames.TivaraWorker,
      effectiveLevel: 2,
      priceSource: "base_production_definition",
      durationMs: 125,
      durationTicks: 3,
      cost: { food: 35 }
    });
    const data = researchDefinitions[ResearchType.TivaraMacemanUpgradeLevel2];
    expect(requireAiTestEntry(world.catalog, 1)).toMatchObject({
      priceSource: "research_definition",
      effectiveLevel: null,
      cost: data.cost,
      durationMs: data.researchTime,
      payment: "immediate"
    });
    f.money.food = 0;
    expect(requireAiTestEntry(world.catalog, 0).cost.food).toBe(35);
    f.capture.dispose();
  });

  it("retains restore and overflow gaps and excludes cross-scene/wrong-owner objects", () => {
    const f = worldFixture();
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(true);
    expect(captureAiRuntimeProductionWorld(f.scene, 2, [f.actor]).gaps).toContain(
      "production_world_restore_in_progress"
    );
    expect(captureAiRuntimeProductionWorld(f.scene, 3, [f.actor]).catalog).toEqual([]);
    expect(
      captureAiRuntimeProductionWorld(
        f.scene,
        2,
        Array.from({ length: 257 }, () => f.actor)
      ).actors
    ).toEqual([]);
    const detached = Object.assign(Object.create(Object.getPrototypeOf(f.actor)), f.actor, { scene: {} });
    expect(captureAiRuntimeProductionWorld(f.scene, 2, [detached]).catalog).toEqual([]);
    f.capture.dispose();
  });

  it("captures a Skaduwee producer's advertised product without inventing research at FrostForge", () => {
    const f = worldFixture();
    f.actor.name = ObjectNames.FrostForge;
    const components = jest.mocked(getActorComponent).getMockImplementation();
    if (!components) throw new Error("synthetic_component_authority_missing");
    jest.mocked(getActorComponent).mockImplementation((actor, component) => {
      if (component === ResearchComponent) return undefined;
      if (component === ProductionComponent)
        return {
          productionDefinition: { availableProduceActors: [ObjectNames.SkaduweeWorker] }
        } as never;
      return components(actor, component);
    });
    const world = captureAiRuntimeProductionWorld(f.scene, 2, [f.actor]);
    expect(world.catalog.map((entry) => entry.productKey)).toEqual([ObjectNames.SkaduweeWorker]);
    expect(requireAiTestEntry(world.catalog, 0).priceSource).toBe("base_production_definition");
    f.capture.dispose();
  });
});
