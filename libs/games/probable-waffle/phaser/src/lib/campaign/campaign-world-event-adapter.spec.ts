import Phaser from "phaser";
import { Subject } from "rxjs";
import { GameEventEmitter } from "@fuzzy-waddle/platform-game-host";
import {
  ResearchType,
  ResourceType,
  type ProbableWafflePlayerDataChangeEvent
} from "@fuzzy-waddle/probable-waffle-protocol";
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { TechTreeService } from "../data/tech-tree/tech-tree.service";
import { ActorIndexSystem } from "../world/services/ActorIndexSystem";
import { SimulationTickService } from "../world/services/simulation-tick.service";
import { CampaignWorldEventAdapter } from "./campaign-world-event-adapter";

describe("CampaignWorldEventAdapter", () => {
  it("adapts research and resource changes with tick and initiator context", () => {
    const actorIndex = Object.assign(Object.create(ActorIndexSystem.prototype), {
      actorRegistered: new GameEventEmitter<Phaser.GameObjects.GameObject>(),
      actorOwnershipChanged: new GameEventEmitter(),
      getAllIdActors: () => []
    }) as ActorIndexSystem;
    const techTree = Object.assign(Object.create(TechTreeService.prototype), {
      researchCompleted: new GameEventEmitter()
    }) as TechTreeService;
    const tickService = Object.assign(Object.create(SimulationTickService.prototype), { currentTick: 17 });
    const playerChanged = new Subject<ProbableWafflePlayerDataChangeEvent>();
    const player = {
      factionType: 2,
      getResources: () => ({ [ResourceType.Wood]: 125 })
    };
    const scene = Object.assign(Object.create(ProbableWaffleScene.prototype), {
      communicator: { playerChanged: { on: playerChanged } },
      baseGameData: {
        gameInstance: {
          getPlayerByNumber: () => player
        }
      },
      getSceneGameData: () => ({ services: [actorIndex, techTree, tickService] })
    }) as ProbableWaffleScene;
    const queueEvent = jest.fn(() => 1);
    const adapter = new CampaignWorldEventAdapter(scene, { queueEvent });
    adapter.start();

    techTree.researchCompleted.emit({ playerNumber: 2, researchType: ResearchType.SnowstormSpell });
    playerChanged.next({
      property: "resource.added",
      data: { playerNumber: 2, playerStateData: { resources: { [ResourceType.Wood]: 25 } } },
      gameInstanceId: "test-game",
      emitterUserId: null
    });

    expect(queueEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        tick: 17,
        kind: "research.completed",
        initiatorPlayerNumber: 2,
        initiatorFaction: "skaduwee"
      })
    );
    expect(queueEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "resource.changed",
        payload: expect.objectContaining({ delta: 25, total: 125 })
      })
    );
    adapter.destroy();
  });
});
