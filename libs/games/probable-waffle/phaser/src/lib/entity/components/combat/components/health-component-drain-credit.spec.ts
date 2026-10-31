import Phaser from "phaser";
import { ProbableWaffleGameInstance } from "@fuzzy-waddle/probable-waffle-protocol";
import { Subject } from "rxjs";
import {
  ResourceType,
  ProbableWafflePlayerType,
  type ProbableWafflePlayerControllerData
} from "@fuzzy-waddle/probable-waffle-protocol";
import { OwnerComponent } from "../../owner-component";
import { ResourceDrainComponent } from "../../resource/resource-drain-component";
import { ResourceServiceObservation } from "../../resource/resource-service-observation";
import type { ResourceServiceEvent } from "../../resource/resource-service-event";
import { getActorComponent } from "../../../../data/actor-component";
import { emitResource, getPlayer, getCommunicator, isSnapshotApplyInProgress } from "../../../../data/scene-data";
import { waitForSimulationDuration } from "../../../../world/services/simulation-time";
import {
  DamageType,
  ProbableWafflePlayer,
  ProbableWafflePlayerState,
  ProbableWafflePlayerController
} from "@fuzzy-waddle/probable-waffle-protocol";
import { HealthComponent } from "./health-component";
import { isGameObjectActiveInActiveScene } from "../../../../data/game-object-helper";
import { AiRuntimeRecipientResourceCapture } from "../../../../player/ai-controller/testing/ai-runtime-recipient-resource-capture";
import { AiRuntimeResourceCoverageCapture } from "../../../../player/ai-controller/testing/ai-runtime-resource-coverage-capture";
import type { AiRuntimeProductionFactV1 } from "../../../../player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";

jest.mock("./health-presentation", () => ({
  HealthPresentation: class {
    attach() {}
    init() {}
    initializeArmorFromData() {}
    reactToDamageVisually() {}
    reactToHeal() {}
    showOnDamage() {}
    syncArmorUiComponent() {}
    refreshUiComponents() {}
    disposeTimers() {}
    detach() {}
    setVisibilityUiComponent() {}
  }
}));
jest.mock("../../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../../data/game-object-helper", () => ({
  onObjectReady: jest.fn(),
  isGameObjectActiveInActiveScene: jest.fn(),
  getGameObjectVisibility: () => ({ visible: false })
}));
jest.mock("../../../../data/scene-data", () => ({
  getCurrentPlayerNumber: jest.fn(),
  getPlayer: jest.fn(),
  emitResource: jest.fn(),
  getCommunicator: jest.fn(),
  isSnapshotApplyInProgress: jest.fn()
}));
jest.mock("../../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../../campaign/campaign-progression-modifier", () => ({
  applyCampaignProgressionModifiers: jest.fn()
}));
jest.mock("../../../../world/services/simulation-time", () => ({
  getSimulationNow: () => 0,
  CancelableSimDelay: class {
    remove() {}
  },
  waitForSimulationDuration: jest.fn()
}));
jest.mock("../../../../world/services/simulation-tick.service", () => ({ SimulationTickService: class {} }));
jest.mock("../../../../world/services/audio.service", () => ({ AudioService: class {} }));
jest.mock("../../owner-component", () => ({ OwnerComponent: class {} }));
jest.mock("../../selectable-component", () => ({ SelectableComponent: class {} }));
jest.mock("../../actor-audio/audio-actor-component", () => ({ AudioActorComponent: class {} }));
jest.mock("../../animation/animation-actor-component", () => ({ AnimationActorComponent: class {} }));
jest.mock("../../building/container-component", () => ({ ContainerComponent: class {} }));
jest.mock("../../construction/construction-site-component", () => ({ ConstructionSiteComponent: class {} }));
jest.mock("../../building/fade-out-component", () => ({ FadeOutComponent: class {} }));
jest.mock("../../building/building-destruction-effect", () => ({
  BuildingDestructionEffect: { spawnDestructionEffects: jest.fn() }
}));

// Native health/drain/journal path with controlled simulation wait and emitResource adapter; no real-match proof.
describe("native health mutation during drain wait", () => {
  it.each(["normal", "granted", "none"] as const)(
    "keeps %s native credit/full return across gatherer damage/death",
    async (economy) => {
      for (const mutation of ["damage", "kill", "silent"] as const) {
        jest.clearAllMocks();
        jest
          .mocked(isGameObjectActiveInActiveScene)
          .mockImplementation((actor): actor is Phaser.GameObjects.GameObject => !!actor?.active);
        const controller = new ProbableWafflePlayerController({
          userId: null,
          playerDefinition: {
            player: { playerNumber: 2, joined: true },
            playerType: ProbableWafflePlayerType.Human,
            campaignEconomy: economy
          }
        } satisfies ProbableWafflePlayerControllerData);
        const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), controller);
        const gameInstance = new ProbableWaffleGameInstance();
        gameInstance.players = [player];
        const scene = {
          get players() {
            return gameInstance.players;
          },
          baseGameData: { gameInstance },
          events: new Phaser.Events.EventEmitter(),
          sys: { queueDepthSort: jest.fn(), displayList: { exists: () => false }, updateList: { remove: jest.fn() } }
        } as unknown as ProbableWaffleScene;
        const targetObject = new Phaser.GameObjects.GameObject(scene, "drain-fixture");
        const actor = new Phaser.GameObjects.GameObject(scene, "gatherer"),
          destroyed = jest.spyOn(actor, "destroy");
        const health = new HealthComponent(actor, { maxHealth: 100 });
        jest
          .mocked(getActorComponent)
          .mockImplementation((_actor, token) =>
            token === OwnerComponent ? ({ getOwner: () => 2 } as never) : undefined
          );
        jest.mocked(getPlayer).mockReturnValue(player);
        const changes = new Subject<{
          property: "resource.added";
          data: { playerNumber: number; playerStateData: { resources: Partial<Record<ResourceType, number>> } };
        }>();
        jest.mocked(getCommunicator).mockReturnValue({ playerChanged: { on: changes } } as never);
        jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
        jest.mocked(emitResource).mockImplementation((_scene, _action, amounts, number) => {
          expect(number).toBe(2);
          player.addResources(amounts);
          changes.next({
            property: "resource.added",
            data: { playerNumber: 2, playerStateData: { resources: amounts } }
          });
        });
        const facts: AiRuntimeProductionFactV1[] = [];
        const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: facts.length }));
        const journal = new AiRuntimeRecipientResourceCapture(
          scene,
          coverage,
          (playerNumber) => ({ playerNumber, tick: 0, sequence: 0 }),
          () => facts.length,
          (fact) => facts.push({ ...fact, sequence: facts.length + 1 })
        );
        let settle: (() => void) | undefined;
        jest.mocked(waitForSimulationDuration).mockReturnValue(
          new Promise<void>((resolve) => {
            settle = resolve;
          })
        );
        const records: ResourceServiceEvent[] = [],
          release = ResourceServiceObservation.subscribe(actor, (event) => records.push(event));
        const drain = new ResourceDrainComponent(targetObject, { cooldown: 100, resourceTypes: [ResourceType.Wood] });
        const context = { cargoOwner: {}, execution: {}, transfer: {} },
          returned = jest.fn();
        drain.onResourcesReturned.subscribe(returned);
        const pending = drain.returnResources(actor, ResourceType.Wood, 3, context);
        expect(coverage.read().lost).toBe(false);
        expect(emitResource).not.toHaveBeenCalled();
        if (mutation === "damage") health.takeDamage(1, DamageType.Physical);
        else if (mutation === "kill") health.killActor();
        else health.destroyActorSilently();
        const lossEpoch = coverage.read().lossEpoch;
        expect(coverage.read().losses).toContain("resource_actor_health_change");
        expect(health.getData().health).toBe(mutation === "damage" ? 99 : 0);
        expect(destroyed).toHaveBeenCalledTimes(mutation === "silent" ? 1 : 0);
        if (mutation === "silent") {
          expect(actor.active).toBe(false);
          expect(actor.scene).toBeUndefined();
        }
        if (!settle) throw new Error("drain_wait_missing");
        settle();
        expect(await pending).toBe(3);
        expect(returned).toHaveBeenCalledWith([ResourceType.Wood, 3, actor]);
        expect(player.getResources().wood).toBe(economy === "normal" ? 203 : 200);
        expect(records.at(-1)).toMatchObject({
          kind: "resource_credit",
          context,
          ownerArgument: 2,
          beneficiary: 2,
          status: economy === "normal" ? "returned" : "campaign_suppressed",
          balanceMatches: economy === "normal"
        });
        if (economy === "normal")
          expect(facts.at(-1)).toMatchObject({ playerNumber: 2, mutation: { phase: "returned", lossEpoch } });
        if (economy === "normal") expect(records.at(-1)).toHaveProperty("application", expect.any(Object));
        expect(coverage.read().lost).toBe(true);
        release();
        journal.dispose();
      }
    }
  );
});
