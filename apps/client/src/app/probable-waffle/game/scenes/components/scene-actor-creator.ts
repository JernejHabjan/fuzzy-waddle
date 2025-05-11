import {
  ActorDefinition,
  ConstructionStateEnum,
  FactionType,
  ProbableWaffleGameStateDataPayload,
  Vector3Simple
} from "@fuzzy-waddle/api-interfaces";
import { ActorManager } from "../../data/actor-manager";
import GameProbableWaffleScene from "../GameProbableWaffleScene";
import { getCommunicator } from "../../data/scene-data";
import Spawn from "../../prefabs/buildings/misc/Spawn";
import EditorOwner from "../../editor-components/EditorOwner";
import { FactionDefinitions } from "../../player/faction-definitions";
import { getGameObjectBounds, getGameObjectTransform } from "../../data/game-object-helper";
import { getActorSystem } from "../../data/actor-system";
import { MovementSystem } from "../../entity/systems/movement.system";
import { ObjectNames } from "../../data/object-names";
import { setFullActorDataFromName } from "../../data/actor-data";
import { pwActorDefinitions } from "../../data/actor-definitions";
import { getActorComponent } from "../../data/actor-component";
import { IdComponent } from "../../entity/actor/components/id-component";

export class SceneActorCreator {
  constructor(private readonly scene: Phaser.Scene) {
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /**
   * After scene is created, store every actor in the game state.
   * All additional changes should be emitted through SceneActorCreatorCommunicator event and actors themselves
   */
  public initInitialActors() {
    this.spawnFromSpawnList();
    this.saveAllKnownActorsToGameState();
  }

  private spawnFromSpawnList() {
    const list = this.scene.children.getChildren();
    const toDestroy: Phaser.GameObjects.GameObject[] = [];
    list.forEach((gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject instanceof Spawn) {
        this.spawnActorsFromSpawnList(gameObject);
        toDestroy.push(gameObject);
      }
      // ensure that game objects are fully created
      const definition = pwActorDefinitions[gameObject.name as ObjectNames];
      if (definition) {
        const idComponent = getActorComponent(gameObject, IdComponent);
        // only initialize those, that haven't been initialized yet
        if (!idComponent) {
          const ownerId = EditorOwner.getComponent(gameObject)?.owner_id;
          const actorDefinition = {
            constructionSite: {
              state: ConstructionStateEnum.Finished
            },
            owner: ownerId ? parseInt(ownerId) : undefined
          } satisfies ActorDefinition;
          setFullActorDataFromName(gameObject, actorDefinition);
        }
      }
    });
    toDestroy.forEach((gameObject) => gameObject.destroy());
  }

  public createActorFromDefinition(actorDefinition: ActorDefinition): Phaser.GameObjects.GameObject | undefined {
    if (!actorDefinition.name) return undefined;
    const actor = ActorManager.createActorFully(this.scene, actorDefinition.name as ObjectNames, actorDefinition);
    const gameObject = this.scene.add.existing(actor);
    this.saveActorToGameState(actor);
    return gameObject;
  }

  public saveAllKnownActorsToGameState() {
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

  private destroy() {}

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
    if (!faction) throw new Error("Faction not found");
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
      owner: owner_id,
      constructionSite: {
        state: ConstructionStateEnum.Finished
      }
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
    }
    return newActor;
  }
}
