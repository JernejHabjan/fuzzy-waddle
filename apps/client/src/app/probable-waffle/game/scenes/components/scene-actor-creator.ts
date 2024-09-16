import {
  ActorDefinition,
  FactionType,
  ProbableWaffleGameStateDataPayload,
  Vector3Simple
} from "@fuzzy-waddle/api-interfaces";
import { ActorManager } from "../../data/actor-manager";
import { SceneActorCreatorCommunicator, SceneActorSaveCommunicator } from "./scene-actor-creator-communicator";
import GameProbableWaffleScene from "../GameProbableWaffleScene";
import { getCommunicator } from "../../data/scene-data";
import Spawn from "../../prefabs/buildings/misc/Spawn";
import EditorOwner from "../../editor-components/EditorOwner";
import { FactionDefinitions } from "../../player/faction-definitions";
import { getGameObjectBounds, getGameObjectTransform } from "../../data/game-object-helper";
import { getActorSystem } from "../../data/actor-system";
import { MovementSystem } from "../../entity/systems/movement.system";
import { getActorComponent } from "../../data/actor-component";
import { OwnerComponent } from "../../entity/actor/components/owner-component";

export class SceneActorCreator {
  constructor(private readonly scene: Phaser.Scene) {
    // NOTE: as this class uses ActorManager to create actors, it must not be accessed in components that are included in the actor definition (circular dependency)
    this.scene.events.on(SceneActorCreatorCommunicator, this.createActorFromDefinition, this);
    this.scene.events.on(SceneActorSaveCommunicator, this.saveAllKnownActorsToSaveGame, this);

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /**
   * After scene is created, store every actor in the game state.
   * All additional changes should be emitted through SceneActorCreatorCommunicator event and actors themselves
   */
  public initActors() {
    this.spawnFromSpawnList();
    this.saveAllKnownActorsToGameState();
  }

  private spawnFromSpawnList() {
    this.scene.children
      .getChildren()
      .filter((c) => c instanceof Spawn)
      .forEach((spawn: Spawn) => {
        this.spawnActorsFromSpawnList(spawn);
        spawn.destroy();
      });
  }

  private createActorFromDefinition(actorDefinition: ActorDefinition): Phaser.GameObjects.GameObject | undefined {
    if (!actorDefinition.name) return undefined;
    const actor = ActorManager.createActor(this.scene, actorDefinition.name, actorDefinition);
    const gameObject = this.scene.add.existing(actor);
    this.saveActorToGameState(actor);
    return gameObject;
  }

  private saveAllKnownActorsToGameState() {
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    const gameScene = this.scene as GameProbableWaffleScene;
    gameScene.baseGameData.gameInstance.gameState!.data.actors = [];
    gameScene.children.each((child) => {
      this.saveActorToGameState(child);
    });

    const communicator = getCommunicator(gameScene);
    const data: ProbableWaffleGameStateDataPayload = {
      gameState: gameScene.baseGameData.gameInstance.gameState!.data
    };
    communicator.gameStateChanged?.send({
      property: "all",
      data,
      gameInstanceId: gameScene.gameInstanceId,
      emitterUserId: gameScene.userId
    });
  }

  private saveActorToGameState(actor?: Phaser.GameObjects.GameObject) {
    if (!actor) return;
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    const gameScene = this.scene as GameProbableWaffleScene;
    const actorDefinition = ActorManager.getActorDefinitionFromActor(actor);
    if (actorDefinition) {
      // check if actor doesn't exist yet in the game state
      const existingActor = gameScene.baseGameData.gameInstance.gameState!.data.actors.find(
        (actor) => actor.id === actorDefinition.id
      );

      if (existingActor) {
        const index = gameScene.baseGameData.gameInstance.gameState!.data.actors.findIndex(
          (actor) => actor.id === actorDefinition.id
        );
        gameScene.baseGameData.gameInstance.gameState!.data.actors[index] = actorDefinition;
      } else {
        gameScene.baseGameData.gameInstance.gameState!.data.actors.push(actorDefinition);
      }
    }
  }

  private saveAllKnownActorsToSaveGame() {
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    // this.saveAllKnownActorsToGameState();
    this.scene.communicator.utilityEvents.emit({ name: "save-game" });
  }

  private destroy() {
    this.scene.events.off(SceneActorCreatorCommunicator, this.createActorFromDefinition, this);
    this.scene.events.off(SceneActorSaveCommunicator, this.saveAllKnownActorsToSaveGame, this);
  }

  private spawnActorsFromSpawnList(spawn: Spawn) {
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    const gameScene = this.scene as GameProbableWaffleScene;
    const vec3 = {
      x: spawn.x,
      y: spawn.y,
      z: spawn.z
    } satisfies Vector3Simple;

    const owner_id = parseInt(EditorOwner.getComponent(spawn).owner_id);
    if (isNaN(owner_id) && owner_id <= 0) return;

    const player = gameScene.players.find(
      (p) => p.playerController.data.playerDefinition?.player.playerNumber === owner_id
    );
    if (!player) return;
    player.playerController.data.playerDefinition!.initialWorldSpawnPosition = vec3;

    const faction = player.playerController.data.playerDefinition!.factionType;
    if (!faction) return;
    let actor: Phaser.GameObjects.GameObject | undefined = undefined;
    switch (faction) {
      case FactionType.Skaduwee:
        FactionDefinitions.skaduwee.initialActors.forEach((actorName, index) => {
          actor = this.createInitialActors(actorName, vec3, owner_id, index, actor);
        });
        break;

      case FactionType.Tivara:
        FactionDefinitions.tivara.initialActors.forEach((actorName, index) => {
          actor = this.createInitialActors(actorName, vec3, owner_id, index, actor);
        });
        break;
      default:
        throw new Error("Faction not found");
    }
  }

  private createInitialActors(
    actorName: string,
    vec3: Vector3Simple,
    owner_id: number,
    index: number,
    previouslyCreatedActor: Phaser.GameObjects.GameObject | undefined
  ): Phaser.GameObjects.GameObject | undefined {
    const previouslyCreatedActorBounds = getGameObjectBounds(previouslyCreatedActor);
    let newX = vec3.x + index * 160;
    if (previouslyCreatedActorBounds) {
      newX = vec3.x + previouslyCreatedActorBounds.width / 2;
    }
    // padding between actors
    newX += 20;
    const actorDefinition = {
      name: actorName,
      x: newX,
      y: vec3.y,
      z: vec3.z,
      owner: owner_id
    } as ActorDefinition;

    const newActor = this.createActorFromDefinition(actorDefinition);
    if (!newActor) return newActor;
    const newActorBounds = getGameObjectBounds(newActor);
    const newActorTransform = getGameObjectTransform(newActor);
    const movementSystem = getActorSystem(newActor, MovementSystem);
    if (previouslyCreatedActor && newActorBounds && newActorTransform && movementSystem) {
      // adjust the actor position by its width
      newActorTransform.x += newActorBounds.width / 2;
      // todo later this should move to some other actor component like ActorTransform or something like that which then emits the transform change event across the game
      movementSystem.instantlyMoveToWorldCoordinates(newActorTransform);
      this.saveActorToGameState(newActor);
    }
    return newActor;
  }
}
