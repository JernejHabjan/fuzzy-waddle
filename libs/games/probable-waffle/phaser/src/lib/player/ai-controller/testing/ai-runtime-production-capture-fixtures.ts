import Phaser from "phaser";
import { Subject } from "rxjs";
import {
  FactionType, ObjectNames, ProbableWaffleAiDifficulty, ProbableWaffleGameInstance, ResearchType, ResourceType,
  type GameCommand, type GameCommandOutcome
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { QueueItemType, type UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { getPlayer } from "../../../data/scene-data";
import { getSceneService, getSceneSystem } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { AiRuntimeProductionCapture } from "./ai-runtime-production-capture";

export function productionCaptureItem(): UnifiedQueueItem {
  return { type: QueueItemType.Production, totalTime: 150, remainingTime: 100,
    productionData: { actorName: ObjectNames.TivaraWorker,
      costData: { costType: PaymentType.PayOverTime, productionTime: 150, refundFactor: 1, resources: { [ResourceType.Food]: 7 } } } };
}

/** Mutable synthetic scene authorities for capture contracts, never proof of a live match. */
export function productionCaptureFixture() {
  const outcomes = new Subject<GameCommandOutcome>();
  const commands = new Subject<GameCommand>();
  const changes = new Subject<{ property: "resource.added" | "resource.removed";
    data: { playerNumber: number; playerStateData: { resources: Partial<Record<ResourceType, number>> } } }>();
  const queueChanges = new Subject<never[]>();
  const unregistered = new Subject<Phaser.GameObjects.GameObject>();
  const registered = new Subject<Phaser.GameObjects.GameObject>();
  const researches = new Subject<{ playerNumber: number; researchType: ResearchType }>();
  const completedResearch = new Set<ResearchType>();
  const ticks = { currentTick: 0, tick$: new Subject<number>() };
  const money: Record<ResourceType, number> = { food: 100, wood: 100, stone: 100, minerals: 100 };
  const queuedItems = [productionCaptureItem(), productionCaptureItem()];
  const queue = { queueDefinition: { capacityPerQueue: 5 }, queues: [{ queuedItems }],
    get allItems() { return queuedItems; }, queueChangedObservable: queueChanges.asObservable() };
  const state = { ...createAiBrainStateV1({ playerNumber: 2, faction: FactionType.Tivara, tick: 0, archetypeId: "balanced",
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium) }) };
  const controller = { getBrainState: () => state, getCommittedObservation: () => undefined,
    getCommittedCapabilityCatalog: () => undefined,
    isDecisionBoundarySettled: jest.fn(() => true) };
  const scene = { players: [{ playerNumber: 2 }], baseGameData: { gameInstance: new ProbableWaffleGameInstance() },
    communicator: { playerChanged: { on: changes } },
    events: new Phaser.Events.EventEmitter() } as unknown as ProbableWaffleScene;
  const actor = { scene, active: true, name: ObjectNames.AnkGuard } as Phaser.GameObjects.GameObject;
  const indexedActors = [actor];
  jest.mocked(getPlayer).mockReturnValue({ getResources: () => money } as never);
  jest.mocked(getSceneSystem).mockReturnValue({ getAiPlayerController: () => controller } as never);
  jest.mocked(getSceneService).mockImplementation((_scene, service) => {
    if (service === SimulationTickService) return ticks as never;
    if (service === CommandBusService) return { command$: commands, commandOutcome$: outcomes } as never;
    if (service === ActorIndexSystem) return { getAllIdActors: () => indexedActors, getOwnedActors: () => indexedActors,
      getActorById: (id: string) => indexedActors.find((entry) => getActorComponent(entry, IdComponent)?.id === id) ?? null,
      actorRegistered: registered, actorUnregistered: unregistered } as never;
    if (service === TechTreeService) return { researchCompleted: researches, getPlayerResearch: () => completedResearch,
      isResearched: (_player: number, type: ResearchType) => completedResearch.has(type) } as never;
    return undefined;
  });
  jest.mocked(getActorComponent).mockImplementation((_actor, component) => {
    if (component === QueueComponent) return queue as never;
    if (component === IdComponent) return { id: "producer" } as never;
    if (component === OwnerComponent) return { getOwner: () => 2 } as never;
    return undefined;
  });
  return { capture: new AiRuntimeProductionCapture(scene), state, controller, scene, actor, queuedItems,
    ticks, money, changes, commands, outcomes, queueChanges, unregistered, registered, indexedActors, researches, completedResearch };
}
