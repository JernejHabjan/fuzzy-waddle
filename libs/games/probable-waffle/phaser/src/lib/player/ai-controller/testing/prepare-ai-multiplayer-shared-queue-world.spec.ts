import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { FactionType, ObjectNames, ProbableWafflePlayerType, ResearchType, ResourceType } from
  "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { ResearchComponent } from "../../../entity/components/research/research-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { prepareAiMultiplayerSharedQueueWorld } from "./prepare-ai-multiplayer-shared-queue-world";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ getPlayer: jest.fn(), emitResource: jest.fn() }));
jest.mock("../../../prefabs/definitions/actor-definitions", () => ({ getPwActorDefinition: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function fixture() {
  const scene = { scene: { key: "MapAiMultiplayer" } } as unknown as ProbableWaffleScene;
  const actor = { active: true, scene, name: ObjectNames.Sandhold };
  const money = { food: 1000, wood: 1000, stone: 1000, minerals: 1000 };
  const queue = { allItems: [], queues: [{}], queueDefinition: { capacityPerQueue: 5 } };
  const research = { availableResearch: [ResearchType.TivaraSlingshotUpgradeLevel2, ResearchType.TivaraMacemanUpgradeLevel2],
    canStartResearch: jest.fn(() => ({ canStart: true })) };
  const tech = { getFactionActorIds: () => [ObjectNames.TivaraWorker, ObjectNames.TivaraSlingshotFemale, ObjectNames.TivaraMacemanMale],
    isResearched: jest.fn(() => false), isContentAllowed: jest.fn(() => true) };
  jest.mocked(getPlayer).mockReturnValue({ factionType: FactionType.Tivara, getResources: () => money,
    playerController: { data: { playerDefinition: { playerType: ProbableWafflePlayerType.Human } } } } as never);
  jest.mocked(getSceneService).mockImplementation((_scene, service) => {
    if (service === ActorIndexSystem) return { getOwnedActors: () => [actor] } as never;
    if (service === TechTreeService) return tech as never;
    return undefined;
  });
  jest.mocked(getActorComponent).mockImplementation((_actor, component) => {
    if (component === IdComponent) return { id: "producer" } as never;
    if (component === ProductionComponent) return { isFinished: true,
      productionDefinition: { availableProduceActors: [ObjectNames.TivaraWorker] } } as never;
    if (component === ResearchComponent) return research as never;
    if (component === QueueComponent) return queue as never;
    return undefined;
  });
  jest.mocked(getPwActorDefinition).mockReturnValue({ components: { gatherer: {}, productionCost: {
    costType: PaymentType.PayImmediately, productionTime: 5000, refundFactor: 0.5, resources: { food: 50 }
  } }, meta: { randomOfType: [ObjectNames.TivaraWorkerFemale, ObjectNames.TivaraWorkerMale] } } as never);
  jest.mocked(emitResource).mockClear();
  jest.mocked(emitResource).mockImplementation((_scene, action, amounts) => {
    for (const type of Object.values(ResourceType)) money[type] += (action === "resource.added" ? 1 : -1) * (amounts[type] ?? 0);
  });
  return { scene, money, queue, research, tech };
}

describe("shared queue world legal capability setup (mocked authority, not bootstrap proof)", () => {
  it("mirrors only definition-derived cash and preserves real worker alias variants for one shared lane", () => {
    const f = fixture();
    const setup = prepareAiMultiplayerSharedQueueWorld(f.scene, 1, "shared_contention");
    expect(setup.initialResources).toEqual({ food: 50, wood: 150, stone: 0, minerals: 200 });
    expect(setup.train.spawnObjectNames).toEqual([ObjectNames.TivaraWorkerFemale, ObjectNames.TivaraWorkerMale]);
    expect(f.queue.allItems).toEqual([]);
    expect(f.research.canStartResearch).toHaveBeenCalledWith(ResearchType.TivaraSlingshotUpgradeLevel2);
  });

  it("selects a distinct faction-legal technology with shortfall until a conservative real-progress refund", () => {
    const f = fixture();
    const setup = prepareAiMultiplayerSharedQueueWorld(f.scene, 1, "cancel_research");
    expect(setup.research.type).toBe(ResearchType.TivaraSlingshotUpgradeLevel2);
    expect(setup.replacement.type).toBe(ResearchType.TivaraMacemanUpgradeLevel2);
    expect(setup.refundBudget).toEqual({ food: 0, wood: 73, stone: 0, minerals: 97 });
    expect(setup.initialResources).toEqual({ food: 0, wood: 150, stone: 0, minerals: 278 });
    expect(setup.initialResources.minerals - (setup.research.price.minerals ?? 0)).toBeLessThan(175);
    expect(f.queue.allItems).toEqual([]);
  });

  it("rejects multiple physical lanes, absent research and already-completed technologies without granting money", () => {
    const f = fixture();
    f.queue.queues.push({});
    expect(() => prepareAiMultiplayerSharedQueueWorld(f.scene, 1, "shared_contention"))
      .toThrow("shared_queue_setup_legal_capability_missing");
    f.queue.queues.pop();
    f.research.availableResearch = [];
    expect(() => prepareAiMultiplayerSharedQueueWorld(f.scene, 1, "cancel_research"))
      .toThrow("shared_queue_setup_legal_capability_missing");
    f.research.availableResearch = [ResearchType.TivaraMacemanUpgradeLevel2];
    f.tech.isResearched.mockReturnValue(true);
    expect(() => prepareAiMultiplayerSharedQueueWorld(f.scene, 1, "shared_contention"))
      .toThrow("shared_queue_setup_legal_capability_missing");
    expect(emitResource).not.toHaveBeenCalled();
  });

  it("fails closed outside the first mirrored multiplayer tick", () => {
    const f = fixture();
    expect(() => prepareAiMultiplayerSharedQueueWorld(f.scene, 2, "cancel_research"))
      .toThrow("shared_queue_setup_authority_missing");
    expect(emitResource).not.toHaveBeenCalled();
  });
});
