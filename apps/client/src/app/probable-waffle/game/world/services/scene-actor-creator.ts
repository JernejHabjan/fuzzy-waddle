import {
  type ActorDefinition,
  ConstructionStateEnum,
  FactionType,
  ObjectNames,
  type ProbableWaffleGameStateDataPayload,
  type Vector3Simple
} from "@fuzzy-waddle/api-interfaces";
import { ActorManager } from "../../data/actor-manager";
import GameProbableWaffleScene from "../scenes/GameProbableWaffleScene";
import { getCommunicator, hasMultiplayerCommandRelay } from "../../data/scene-data";
import Spawn from "../../prefabs/buildings/misc/Spawn";
import EditorOwner from "../scenes/editor-components/EditorOwner";
import EditorActorLevel from "../scenes/editor-components/EditorActorLevel";
import { FactionDefinitions } from "../../player/faction-definitions";
import {
  getGameObjectBounds,
  getGameObjectLogicalTransform,
  getGameObjectVisibility
} from "../../data/game-object-helper";
import { getActorSystem } from "../../data/actor-system";
import { MovementSystem } from "../../entity/systems/movement.system";
import { setFullActorDataFromName } from "../../data/actor-data";
import { getPwActorDefinition } from "../../prefabs/definitions/actor-definitions";
import { getActorComponent } from "../../data/actor-component";
import { IdComponent } from "../../entity/components/id-component";
import { getSceneService } from "./scene-component-helpers";
import { ActorIndexSystem } from "./ActorIndexSystem";
import { LoadGame } from "../../data/load-game";
import type { InitialActorConfig } from "../../player/faction-info";
import { LevelComponent } from "../../entity/components/level/level-component";
import { TechTreeService } from "../../data/tech-tree/tech-tree.service";
import GameObject = Phaser.GameObjects.GameObject;
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { upgradeActorToLevel } from "../../data/actor-level-utils";
import { ActorIdAuthorityService } from "./multiplayer/actor-id-authority.service";

export class SceneActorCreator {
  private readonly loadGame: LoadGame;
  private readonly actorIdAuthority: ActorIdAuthorityService;
  private readonly lifecycleBoundActors = new WeakSet<GameObject>();
  constructor(private readonly scene: GameProbableWaffleScene) {
    this.loadGame = new LoadGame(scene as GameProbableWaffleScene);
    this.actorIdAuthority = new ActorIdAuthorityService(scene);
  }

  /**
   * After scene is created, store every actor in the game state.
   * All additional changes should be emitted through SceneActorCreatorCommunicator event and actors themselves
   */
  public initInitialActors() {
    // After scene is created, store every actor in the game state.
    // All additional changes should be emitted through SceneActorCreatorCommunicator event and actors themselves
    const isStartupLoad = this.scene.baseGameData.gameInstance.gameInstanceMetadata.isStartupLoad();
    if (isStartupLoad) {
      this.loadGame.load();
      this.removeSpawnsAfterLoad();
    } else {
      this.spawnFromSpawnList();
    }
    // Host mirrors canonical actor state to server for validation/recovery flows.
    if (this.scene.isHost) {
      this.saveAllKnownActorsToGameState();
    }
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
      const definition = getPwActorDefinition(gameObject.name as ObjectNames, null);
      if (definition) {
        const idComponent = getActorComponent(gameObject, IdComponent);
        // only initialize those, that haven't been initialized yet
        if (!idComponent) {
          const ownerId = EditorOwner.getComponent(gameObject)?.owner_id;
          const editorLevel = EditorActorLevel.getComponent(gameObject)?.level ?? 1;
          const actorDefinition = {
            constructionSite: {
              state: ConstructionStateEnum.Finished
            },
            owner: {
              ownerId: ownerId ? parseInt(ownerId) : undefined
            },
            level: editorLevel > 1 ? { level: editorLevel } : undefined
          } satisfies ActorDefinition;
          setFullActorDataFromName(gameObject, actorDefinition);
          // Apply editor-specified level upgrade after components are set up
          if (editorLevel > 1) {
            upgradeActorToLevel(gameObject, editorLevel);
          }
        }
        // Register in the actor index after init
        this.registerAndSaveNewActor(gameObject);
      }
    });
    toDestroy.forEach((gameObject) => gameObject.destroy());
  }

  private removeSpawnsAfterLoad() {
    const list = this.scene.children.getChildren();
    const toDestroy: Phaser.GameObjects.GameObject[] = [];
    list.forEach((gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject instanceof Spawn) {
        toDestroy.push(gameObject);
      }
    });
    toDestroy.forEach((gameObject) => gameObject.destroy());
  }

  public createActorFromDefinition(actorDefinition: ActorDefinition): Phaser.GameObjects.GameObject | undefined {
    if (!actorDefinition.name) return undefined;

    const shouldConstructFully = this.shouldConstructActorFully(actorDefinition);
    let actor: GameObject;
    if (shouldConstructFully) {
      actor = ActorManager.createActorFully(this.scene, actorDefinition.name as ObjectNames, actorDefinition);
    } else {
      // not fully built construction site
      actor = ActorManager.createActorConstructing(this.scene, actorDefinition.name as ObjectNames, actorDefinition);
    }

    // Restore level-based upgrades (animations, stats) if saved level > 1.
    // setFullActorDataFromName applies saved health/attack data but not animations.
    // upgradeActorToLevel re-applies animations and stat maximums for the level,
    // then we restore any saved health to preserve current HP below max.
    const savedLevel = actorDefinition.level?.level;
    if (savedLevel && savedLevel > 1) {
      const levelComponent = getActorComponent(actor, LevelComponent);
      if (levelComponent && savedLevel <= levelComponent.maxLevel) {
        const savedHealth = actorDefinition.health;
        upgradeActorToLevel(actor, savedLevel);
        // Re-apply saved health so current HP is preserved (upgradeActorToLevel resets to max)
        if (savedHealth) {
          getActorComponent(actor, HealthComponent)?.setData(savedHealth);
        }
      }
    }

    const gameObject = this.scene.add.existing(actor);
    this.registerAndSaveNewActor(gameObject, actorDefinition.id?.id);
    return gameObject;
  }

  /**
   * Creates an actor at a specified position with optional owner.
   * Commonly used for spawning actors from spells or production.
   * The actor is created fully built and hidden by default (fog-of-war handles visibility).
   *
   * @param actorName - The name of the actor to create
   * @param position - World position to spawn at
   * @param ownerId - Optional owner ID
   * @returns The created game object or undefined if creation failed
   */
  public createFinishedActor(
    actorName: ObjectNames,
    position: Vector3Simple,
    ownerId?: number
  ): Phaser.GameObjects.GameObject | undefined {
    const actorDefinition: ActorDefinition = {
      name: actorName,
      representable: {
        logicalWorldTransform: position
      },
      ...(ownerId !== undefined && {
        owner: {
          ownerId: ownerId
        }
      }),
      constructionSite: {
        state: ConstructionStateEnum.Finished
      }
    };

    const newGameObject = this.createActorFromDefinition(actorDefinition);
    if (newGameObject) {
      // Apply researched upgrades if this unit has a level component
      const levelComponent = getActorComponent(newGameObject, LevelComponent);
      if (levelComponent && ownerId !== undefined) {
        const techTreeService = getSceneService(this.scene, TechTreeService);
        if (techTreeService) {
          const researchedLevel = techTreeService.getResearchedLevelForUnit(ownerId, actorName);
          if (researchedLevel > 1 && researchedLevel <= levelComponent.maxLevel) {
            upgradeActorToLevel(newGameObject, researchedLevel);
          }
        }
      }

      // Hide by default - fog-of-war will show it if visible for player
      const visibilityComponent = getGameObjectVisibility(newGameObject);
      if (visibilityComponent) {
        visibilityComponent.setVisible(false);
      }
    }

    return newGameObject;
  }

  private shouldConstructActorFully(actorDefinition: ActorDefinition): boolean {
    const constructionState = actorDefinition.constructionSite?.state;
    return constructionState === ConstructionStateEnum.Finished || constructionState === undefined;
  }

  public registerAndSaveNewActor(actor: Phaser.GameObjects.GameObject, authoritativeId?: string) {
    this.actorIdAuthority.applyAuthoritativeOrDeterministicId(actor, authoritativeId);
    this.bindLifecycleHandlers(actor);

    const actorIndex = getSceneService(this.scene, ActorIndexSystem);
    actorIndex?.registerActor(actor);
    this.saveActorToGameState(actor);
    this.syncHostActorState();
  }

  public saveAllKnownActorsToGameState() {
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    const gameScene = this.scene as GameProbableWaffleScene;
    gameScene.baseGameData.gameInstance.gameState!.data.actors = [];

    // Prefer indexed actors to avoid scanning non-actors
    const actorIndex = getSceneService(this.scene, ActorIndexSystem);
    const iterable = actorIndex?.getAllIdActors() ?? gameScene.children.getChildren();

    iterable.forEach((child) => {
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

  private bindLifecycleHandlers(actor: Phaser.GameObjects.GameObject) {
    if (this.lifecycleBoundActors.has(actor)) {
      return;
    }
    this.lifecycleBoundActors.add(actor);
    actor.once(Phaser.GameObjects.Events.DESTROY, () => this.handleActorDestroyed(actor));
  }

  private handleActorDestroyed(actor: Phaser.GameObjects.GameObject) {
    const actorId = getActorComponent(actor, IdComponent)?.id;
    if (!actorId) {
      return;
    }

    if (!(this.scene instanceof GameProbableWaffleScene)) {
      return;
    }

    const actors = this.scene.baseGameData.gameInstance.gameState?.data.actors;
    if (!actors) {
      return;
    }

    const actorIndex = actors.findIndex((entry) => entry.id?.id === actorId);
    if (actorIndex === -1) {
      return;
    }

    actors.splice(actorIndex, 1);
    this.syncHostActorState();
  }

  /**
   * Host-only actor sync must happen immediately so server validation can
   * see newly created/destroyed actors in the same tick as command ingest.
   */
  private syncHostActorState() {
    if (!this.scene.isHost || !hasMultiplayerCommandRelay(this.scene)) {
      return;
    }

    this.saveAllKnownActorsToGameState();
  }

  private spawnActorsFromSpawnList(spawn: Spawn) {
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    const gameScene = this.scene as GameProbableWaffleScene;
    const logicalSpawnPoint = {
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
    player.playerController.data.playerDefinition!.initialWorldLogicalSpawnPosition = logicalSpawnPoint;

    const faction = player.playerController.data.playerDefinition!.factionType;
    if (!faction) throw new Error("Faction not found");
    let actor: Phaser.GameObjects.GameObject | undefined = undefined;
    switch (faction) {
      case FactionType.Skaduwee:
        FactionDefinitions.skaduwee.initialActors.forEach((actorConfig, index) => {
          actor = this.createInitialActors(actorConfig, logicalSpawnPoint, owner_id, index, actor);
        });
        break;

      case FactionType.Tivara:
        FactionDefinitions.tivara.initialActors.forEach((actorConfig, index) => {
          actor = this.createInitialActors(actorConfig, logicalSpawnPoint, owner_id, index, actor);
        });
        break;
      default:
        throw new Error("Faction not found");
    }
  }

  private createInitialActors(
    actorConfig: InitialActorConfig,
    logicalSpawnPoint: Vector3Simple,
    owner_id: number,
    index: number,
    previouslyCreatedActor: Phaser.GameObjects.GameObject | undefined
  ): Phaser.GameObjects.GameObject | undefined {
    const actorName = actorConfig.actorName;
    const constructionState = actorConfig.constructionState ?? ConstructionStateEnum.Finished;

    const previouslyCreatedActorBounds = getGameObjectBounds(previouslyCreatedActor);
    let newX = logicalSpawnPoint.x + index * 160;
    if (previouslyCreatedActorBounds) {
      newX = logicalSpawnPoint.x + previouslyCreatedActorBounds.width / 2;
    }
    // padding between actors
    newX += 20;

    const newLogicalSpawnPoint = {
      x: newX,
      y: logicalSpawnPoint.y,
      z: logicalSpawnPoint.z
    } satisfies Vector3Simple;
    const actorDefinition = {
      name: actorName,
      representable: {
        logicalWorldTransform: newLogicalSpawnPoint
      },
      owner: {
        ownerId: owner_id
      },
      constructionSite: {
        state: constructionState
      }
    } satisfies ActorDefinition;

    const newActor = this.createActorFromDefinition(actorDefinition);
    if (!newActor) return newActor;
    const newActorBounds = getGameObjectBounds(newActor);
    const actorLogicalTransform = getGameObjectLogicalTransform(newActor);
    const movementSystem = getActorSystem(newActor, MovementSystem);
    if (previouslyCreatedActor && newActorBounds && actorLogicalTransform && movementSystem) {
      // adjust the actor position by its width
      actorLogicalTransform.x += newActorBounds.width / 2;
      movementSystem.instantlyMoveToWorldCoordinates(actorLogicalTransform);
    }
    return newActor;
  }
}
