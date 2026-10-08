import Phaser from "phaser";
import { Subject } from "rxjs";
import { ResourceType, ConstructionStateEnum, ProbableWafflePlayerType, ProbableWafflePlayer,
  ProbableWafflePlayerState, ProbableWafflePlayerController, type ProbableWafflePlayerControllerData } from
  "@fuzzy-waddle/probable-waffle-protocol";
import type { ConstructionSiteDefinition } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";
import { ConstructionSiteComponent } from "./construction-site-component";
import { HealthComponent } from "../combat/components/health-component";
import { OwnerComponent } from "../owner-component";
import { ResourceDrainComponent } from "../resource/resource-drain-component";
import { ResourceServiceObservation } from "../resource/resource-service-observation";
import type { ResourceServiceEvent } from "../resource/resource-service-event";
import { getActorComponent } from "../../../data/actor-component";
import { onObjectReady } from "../../../data/game-object-helper";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { emitResource, getPlayer, getCommunicator, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { waitForSimulationDuration } from "../../../world/services/simulation-time";
import { AiRuntimeRecipientResourceCapture } from "../../../player/ai-controller/testing/ai-runtime-recipient-resource-capture";
import { AiRuntimeResourceCoverageCapture } from "../../../player/ai-controller/testing/ai-runtime-resource-coverage-capture";
import type { AiRuntimeProductionFactV1 } from "../../../player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";

jest.mock("../combat/components/health-presentation", () => ({ HealthPresentation: class { attach() {} } }));
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn(), getGameObjectVisibility: () => undefined }));
jest.mock("../../../data/actor-data", () => ({ upgradeFromConstructingToFullActorData: jest.fn() }));
jest.mock("../../../data/actor-level-utils", () => ({ getResearchedLevelForActor: () => null }));
jest.mock("../../../prefabs/definitions/actor-definitions", () => ({ getPwActorDefinition: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ getPlayer: jest.fn(), emitResource: jest.fn(),
  getCommunicator: jest.fn(), isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: () => undefined }));
jest.mock("../../../world/services/simulation-time", () => ({ waitForSimulationDuration: jest.fn() }));
jest.mock("../owner-component", () => ({ OwnerComponent: class {} }));
jest.mock("../building/container-component", () => ({ ContainerComponent: class {} }));
jest.mock("./construction-progress-ui-component", () => ({ ConstructionProgressUiComponent: class {} }));
jest.mock("./construction-payment", () => ({ startConstructionPayment: jest.fn(), refundConstructionPayment: jest.fn() }));

// Real construction/health/drain/recipient journal, controlled wait and resource adapter; no actual-match proof.
describe("construction readiness changes during native drain wait (authored; final gate pending)", () => {
  beforeEach(() => { jest.clearAllMocks(); jest.mocked(onObjectReady).mockReset(); });

  it.each(["normal", "granted", "none"] as const)("preserves %s delivery after construction/repair", async (economy) => {
    for (const route of ["progress", "repair"] as const) {
      jest.clearAllMocks(); jest.mocked(onObjectReady).mockReset();
      const players = [1, 2].map((playerNumber) => new ProbableWafflePlayer(new ProbableWafflePlayerState(),
        new ProbableWafflePlayerController({ userId: null, playerDefinition: {
          player: { playerNumber, joined: true }, playerType: ProbableWafflePlayerType.Human, campaignEconomy: economy
        } } satisfies ProbableWafflePlayerControllerData)));
      const scene = { players, events: new Phaser.Events.EventEmitter() } as ProbableWaffleScene;
      const target = new Phaser.GameObjects.GameObject(scene, "site"); target.name = "site";
      const gatherer = new Phaser.GameObjects.GameObject(scene, "gatherer");
      const health = new HealthComponent(target, { maxHealth: 100, maxArmour: 20 });
      let owner = 1;
      jest.mocked(getActorComponent).mockImplementation((_actor, token) => {
        if (token === OwnerComponent) return { getOwner: () => owner } as never;
        if (token === HealthComponent) return health as never;
        return undefined;
      });
      jest.mocked(getPwActorDefinition).mockReturnValue({ components: { productionCost: { productionTime: 1000 } } } as never);
      const policy = { startImmediately: false, consumesBuilders: false, maxAssignedBuilders: 1, maxAssignedRepairers: 1,
        progressMadeAutomatically: 1, progressMadePerBuilder: 1, repairFactor: 1, initialHealthPercentage: 0.1,
        refundFactor: 0.5, canBeDragPlaced: false } satisfies ConstructionSiteDefinition;
      const construction = new ConstructionSiteComponent(target, policy);
      const call = jest.mocked(onObjectReady).mock.calls.find((entry) => entry[2] === construction);
      if (!call) throw new Error("construction_ready_missing"); call[1].call(call[2]);
      construction.setData({ state: route === "repair" ? ConstructionStateEnum.Finished : ConstructionStateEnum.Constructing,
        remainingConstructionTime: 1000 });
      if (route === "repair") construction.assignRepairer(gatherer);
      jest.mocked(getPlayer).mockImplementation((_scene, number) => players.find((player) => player.playerNumber === number));
      const changes = new Subject<{ property: "resource.added"; data: { playerNumber: number;
        playerStateData: { resources: Partial<Record<ResourceType, number>> } } }>();
      jest.mocked(getCommunicator).mockReturnValue({ playerChanged: { on: changes } } as never);
      jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
      jest.mocked(emitResource).mockImplementation((_scene, _action, amounts, number) => {
        expect(number).toBe(2); players[1].addResources(amounts);
        changes.next({ property: "resource.added", data: { playerNumber: 2, playerStateData: { resources: amounts } } });
      });
      const facts: AiRuntimeProductionFactV1[] = [];
      const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: facts.length }));
      const journal = new AiRuntimeRecipientResourceCapture(scene, coverage,
        (playerNumber) => ({ playerNumber, tick: 0, sequence: 0 }), () => facts.length,
        (fact) => facts.push({ ...fact, sequence: facts.length + 1 }));
      let settle: (() => void) | undefined;
      jest.mocked(waitForSimulationDuration).mockReturnValue(new Promise<void>((resolve) => { settle = resolve; }));
      const drain = new ResourceDrainComponent(target, { cooldown: 100, resourceTypes: [ResourceType.Wood] });
      const context = { cargoOwner: {}, execution: {}, transfer: {} }, records: ResourceServiceEvent[] = [];
      const release = ResourceServiceObservation.subscribe(gatherer, (event) => records.push(event));
      const returned = jest.fn(); drain.onResourcesReturned.subscribe(returned);
      const pending = drain.returnResources(gatherer, ResourceType.Wood, 3, context);
      expect(coverage.read().lost).toBe(false); construction.update(); owner = 2;
      expect(coverage.read().losses).toEqual([route === "progress" ?
        "resource_actor_construction_change" : "resource_actor_health_change"]);
      expect(health.getData().health).toBeGreaterThan(10); expect(health.getData().armour).toBe(route === "repair" ? 2 :
        2 + 18 * (1000 - construction.getData().remainingConstructionTime) / 1000);
      expect(emitResource).not.toHaveBeenCalled();
      const lossEpoch = coverage.read().lossEpoch;
      if (!settle) throw new Error("wait_missing"); settle();
      expect(await pending).toBe(3); expect(returned).toHaveBeenLastCalledWith([ResourceType.Wood, 3, gatherer]);
      expect(players[0].getResources().wood).toBe(200);
      expect(players[1].getResources().wood).toBe(economy === "normal" ? 203 : 200);
      expect(records.at(-1)).toMatchObject({ kind: "resource_credit", context, ownerArgument: 2, beneficiary: 2,
        status: economy === "normal" ? "returned" : "campaign_suppressed", balanceMatches: economy === "normal" });
      if (economy === "normal") {
        expect(records.at(-1)).toHaveProperty("application", expect.any(Object));
        expect(facts.at(-1)).toMatchObject({ playerNumber: 2, mutation: { phase: "returned", lossEpoch } });
      }
      expect(coverage.read().lost).toBe(true); release(); journal.dispose();
    }
  });
});
