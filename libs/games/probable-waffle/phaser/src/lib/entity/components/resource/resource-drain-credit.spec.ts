import type Phaser from "phaser";
import { Subject } from "rxjs";
import { ProbableWafflePlayer, ProbableWafflePlayerController, ProbableWafflePlayerState } from
  "@fuzzy-waddle/probable-waffle-protocol";
import { OwnerComponent } from "../owner-component";
import { AiRuntimeRecipientResourceCapture } from "../../../player/ai-controller/testing/ai-runtime-recipient-resource-capture";
import { AiRuntimeResourceCoverageCapture } from "../../../player/ai-controller/testing/ai-runtime-resource-coverage-capture";
import type { AiRuntimeProductionFactV1 } from "../../../player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { ResourceDrainComponent } from "./resource-drain-component";
import { ResourceServiceObservation } from "./resource-service-observation";
import type { ResourceServiceEvent } from "./resource-service-event";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getPlayer, getCommunicator, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { waitForSimulationDuration } from "../../../world/services/simulation-time";

jest.mock("../owner-presentation", () => ({ OwnerPresentation: class {
  attach() {} tryToSetComponents() {} assignOwnerColor() {} setOwnerColorToActor() {} playBlinkEffect() {}
} }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../world/services/ActorIndexSystem", () => ({ ActorIndexSystem: class {} }));
jest.mock("../../../data/player-relation", () => ({ arePlayersAllied: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn() }));
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ emitResource: jest.fn(), getPlayer: jest.fn(),
  getCommunicator: jest.fn(), isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/simulation-time", () => ({ waitForSimulationDuration: jest.fn() }));

describe("native drain credit policy (unrun until final gate)", () => {
  it.each(["normal", "granted", "none"] as const)("preserves %s economy and full native return after the wait", async (economy) => {
    jest.clearAllMocks();
    const scene = {} as Phaser.Scene, actor = { scene } as Phaser.GameObjects.GameObject;
    const target = { scene } as Phaser.GameObjects.GameObject;
    let resolve: (() => void) | undefined;
    jest.mocked(waitForSimulationDuration).mockReturnValue(new Promise<void>((settle) => { resolve = settle; }));
    jest.mocked(getActorComponent).mockReturnValue({ getOwner: () => 2 } as never);
    jest.mocked(getPlayer).mockReturnValue({ playerController: { data: { playerDefinition: { campaignEconomy: economy } } },
      getResources: () => ({ food: 10, wood: 10, stone: 10, minerals: 10 }) } as never);
    jest.mocked(getCommunicator).mockReturnValue({} as never);
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    const records: ResourceServiceEvent[] = [], release = ResourceServiceObservation.subscribe(actor, (event) => records.push(event));
    const drain = new ResourceDrainComponent(target, { cooldown: 100, resourceTypes: [ResourceType.Wood] });
    const subject = jest.fn(); drain.onResourcesReturned.subscribe(subject);
    const pending = drain.returnResources(actor, ResourceType.Wood, 3);
    expect(emitResource).not.toHaveBeenCalled(); expect(subject).not.toHaveBeenCalled();
    if (!resolve) throw new Error("drain_wait_missing"); resolve();
    expect(await pending).toBe(3); expect(subject).toHaveBeenCalledWith([ResourceType.Wood, 3, actor]);
    expect(emitResource).toHaveBeenCalledTimes(economy === "normal" ? 1 : 0);
    expect(records.at(-1)).toMatchObject({ kind: "resource_credit", ownerArgument: 2, beneficiary: 2, amount: 3,
      status: economy === "normal" ? "returned" : "campaign_suppressed", balanceMatches: false });
    release();
  });
  it.each(["normal", "granted", "none"] as const)(
    "uses the post-wait converted owner for %s economy while old capture history stays lost", async (economy) => {
      jest.clearAllMocks();
      const players = [1, 2].map((number) => {
        const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
        Object.defineProperty(player, "playerNumber", { value: number }); return player;
      });
      const scene = { players } as ProbableWaffleScene;
      const actor = { scene } as Phaser.GameObjects.GameObject;
      const target = { scene, emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
      const owner = new OwnerComponent(target, { color: [] }); owner.setOwner(1);
      jest.mocked(getActorComponent).mockImplementation((_actor, token) => token === OwnerComponent ? owner as never : undefined);
      const facts: AiRuntimeProductionFactV1[] = [];
      const coverage = new AiRuntimeResourceCoverageCapture(0, () => ({ tick: 0, captureSequence: facts.length }));
      const journal = new AiRuntimeRecipientResourceCapture(scene, coverage,
        (playerNumber) => ({ playerNumber, tick: 0, sequence: 0 }), () => facts.length,
        (fact) => facts.push({ ...fact, sequence: facts.length + 1 }));
      const changes = new Subject<{ property: "resource.added"; data: { playerNumber: number;
        playerStateData: { resources: Partial<Record<ResourceType, number>> } } }>();
      jest.mocked(getPlayer).mockImplementation((_scene, number) => {
        const player = players.find((candidate) => candidate.playerNumber === number);
        return player ? { getResources: () => player.getResources(),
          playerController: { data: { playerDefinition: { campaignEconomy: economy } } } } as never : undefined;
      });
      jest.mocked(getCommunicator).mockReturnValue({ playerChanged: { on: changes } } as never);
      jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
      jest.mocked(emitResource).mockImplementation((_scene, _action, amounts, number) => {
        const player = players.find((candidate) => candidate.playerNumber === number);
        if (!player || number === undefined) throw new Error("recipient_missing");
        player.addResources(amounts);
        changes.next({ property: "resource.added", data: { playerNumber: number, playerStateData: { resources: amounts } } });
      });
      let settle: (() => void) | undefined;
      jest.mocked(waitForSimulationDuration).mockReturnValue(new Promise<void>((resolve) => { settle = resolve; }));
      const records: ResourceServiceEvent[] = [];
      const release = ResourceServiceObservation.subscribe(actor, (event) => records.push(event));
      const drain = new ResourceDrainComponent(target, { cooldown: 100, resourceTypes: [ResourceType.Wood] });
      const context = { cargoOwner: {}, execution: {}, transfer: {} }, returned = jest.fn();
      drain.onResourcesReturned.subscribe(returned);
      const pending = drain.returnResources(actor, ResourceType.Wood, 3, context);
      expect(coverage.read().lost).toBe(false); expect(emitResource).not.toHaveBeenCalled();
      owner.setOwner(2); expect(coverage.read().losses).toContain("resource_actor_owner_change");
      if (!settle) throw new Error("drain_wait_missing"); settle();
      expect(await pending).toBe(3); expect(returned).toHaveBeenCalledWith([ResourceType.Wood, 3, actor]);
      expect(players[0].getResources().wood).toBe(200);
      expect(players[1].getResources().wood).toBe(economy === "normal" ? 203 : 200);
      expect(records.at(-1)).toMatchObject({ kind: "resource_credit", ownerArgument: 2, beneficiary: 2,
        context, status: economy === "normal" ? "returned" : "campaign_suppressed", balanceMatches: economy === "normal" });
      if (economy === "normal") expect(facts.at(-1)).toMatchObject({ playerNumber: 2,
        mutation: { phase: "returned", lossEpoch: 1 } });
      expect(coverage.read().lost).toBe(true); release(); journal.dispose();
    }
  );

});
