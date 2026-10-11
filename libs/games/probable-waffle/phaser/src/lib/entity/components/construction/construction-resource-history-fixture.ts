import Phaser from "phaser";
import { ProbableWaffleGameInstance } from "@fuzzy-waddle/probable-waffle-protocol";
import { Subject } from "rxjs";
import { ProbableWafflePlayer, ProbableWafflePlayerState, ProbableWafflePlayerController } from
  "@fuzzy-waddle/probable-waffle-protocol";
import type { ConstructionSiteDefinition } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { ConstructionSiteComponent } from "./construction-site-component";
import { HealthComponent } from "../combat/components/health-component";
import { getActorComponent } from "../../../data/actor-component";
import { onObjectReady, getGameObjectVisibility } from "../../../data/game-object-helper";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AudioService } from "../../../world/services/audio.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { AiRuntimeRecipientResourceCapture } from "../../../player/ai-controller/testing/ai-runtime-recipient-resource-capture";
import { AiRuntimeResourceCoverageCapture } from "../../../player/ai-controller/testing/ai-runtime-resource-coverage-capture";
import type { AiRuntimeProductionFactV1 } from "../../../player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";

jest.mock("../combat/components/health-presentation", () => ({ HealthPresentation: class {
  attach() {} init() {} initializeArmorFromData() {} disposeTimers() {} detach() {}
} }));
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn(), getGameObjectVisibility: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ isSnapshotApplyInProgress: () => false }));
jest.mock("../../../data/actor-data", () => ({ upgradeFromConstructingToFullActorData: jest.fn() }));
jest.mock("../../../data/actor-level-utils", () => ({ getResearchedLevelForActor: () => null }));
jest.mock("../../../prefabs/definitions/actor-definitions", () => ({ getPwActorDefinition: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../world/services/audio.service", () => ({ AudioService: class {} }));
jest.mock("./construction-progress-ui-component", () => ({ ConstructionProgressUiComponent: class {} }));
jest.mock("./construction-payment", () => ({ startConstructionPayment: jest.fn(), refundConstructionPayment: jest.fn() }));

/** Real construction/health facades and recipient journal; only ready, definitions, payment and presentation are controlled. */
export function constructionHistoryFixture(overrides: Partial<ConstructionSiteDefinition> = {}, withHealth = true) {
  const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
  Object.defineProperty(player, "playerNumber", { value: 1 });
  const gameInstance = new ProbableWaffleGameInstance(); gameInstance.players = [player];
  const scene = { get players() { return gameInstance.players; }, baseGameData: { gameInstance },
    events: new Phaser.Events.EventEmitter() } as ProbableWaffleScene;
  const actor = Object.assign(new Phaser.Events.EventEmitter(), { scene, name: "site", active: true, getData: jest.fn() });
  const object = actor as unknown as Phaser.GameObjects.GameObject;
  const health = new HealthComponent(object, { maxHealth: 100, maxArmour: 20 });
  let currentHealth: HealthComponent | undefined = withHealth ? health : undefined;
  const ticks = new Subject<number>(), audio = { playSpatialAudioSprite: jest.fn() }, index = { getActorById: jest.fn(() => null) };
  const production = { costType: 0, productionTime: 1000, resources: { wood: 3 } };
  const policy = { startImmediately: false, consumesBuilders: false, maxAssignedBuilders: 2, maxAssignedRepairers: 2,
    progressMadeAutomatically: 1, progressMadePerBuilder: 1, repairFactor: 1, initialHealthPercentage: 0.1,
    refundFactor: 0.5, canBeDragPlaced: false, ...overrides } satisfies ConstructionSiteDefinition;
  jest.mocked(getActorComponent).mockImplementation((_actor, token) => {
    if (token === HealthComponent) return currentHealth as never;
    if (token === IdComponent) return { id: "actor" } as never;
    return undefined;
  });
  jest.mocked(getGameObjectVisibility).mockReturnValue({ visible: true } as never);
  jest.mocked(getPwActorDefinition).mockReturnValue({ components: { productionCost: production } } as never);
  jest.mocked(getSceneService).mockImplementation((_scene, token) => {
    if (token === AudioService) return audio as never;
    if (token === SimulationTickService) return { tick$: ticks } as never;
    if (token === ActorIndexSystem) return index as never;
    return undefined;
  });
  const component = new ConstructionSiteComponent(object, policy);
  const facts: AiRuntimeProductionFactV1[] = [];
  const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: facts.length }));
  const journal = new AiRuntimeRecipientResourceCapture(scene, coverage,
    (playerNumber) => ({ playerNumber, tick: 0, sequence: 0 }), () => facts.length,
    (fact) => facts.push({ ...fact, sequence: facts.length + 1 }));
  const ready = () => {
    const call = jest.mocked(onObjectReady).mock.calls.find((entry) => entry[2] === component);
    if (!call) throw new Error("construction_ready_missing"); call[1].call(call[2]);
  };
  return { actor, object, scene, health, component, ticks, audio, index, production, policy, facts, coverage, journal, player,
    ready, replaceHealth: (next: HealthComponent | undefined) => { currentHealth = next; } };
}
