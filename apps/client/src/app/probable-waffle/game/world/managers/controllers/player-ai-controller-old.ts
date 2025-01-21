import { PlayerController_old } from "./player-controller_old";
import {
  ActorAbleToBeCreatedClass,
  ActorAbleToBeProducedClass
} from "../../../entity/building/production/production-queue";
import { Actor } from "../../../entity/actor/actor";
import { ResourceDrainComponent } from "../../../entity/economy/resource/resource-drain-component";
import { GameplayLibrary } from "../../../library/gameplay-library";
import { ResourceSourceComponent } from "../../../entity/economy/resource/resource-source-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PlayerAiBlackboard } from "../../../entity/character/ai/player-ai/player-ai-blackboard";
import { DefaultPlayerAiBehaviorTree_old } from "../../../entity/character/ai/player-ai/default-player-ai-behavior-tree_old";
import { ProductionComponent } from "../../../entity/building/production/production-component";

export class PlayerAiControllerOld extends PlayerController_old {
  /**
   * Behavior tree to use for driving the player ai
   */
  behaviorTree: DefaultPlayerAiBehaviorTree_old;

  /**
   * Blackboard to use for holding all data relevant to the player ai
   */
  blackboard: PlayerAiBlackboard;

  /**
   * Units and building the ai should produce, in order
   */
  buildOrder: ActorAbleToBeCreatedClass[] = [];
  /**
   * Whether killing an actor owned by this player yields a reward for the attacking player
   */
  givesBounty = false;
  /**
   * Maximum distance of a new building to an existing one
   */
  private maximumBaseBuildingDistance = 5;
  /**
   * Type of the primary resource for the ai to gather (e.g. used for placing resource drains)
   */
  private primaryResourceType?: ResourceType;

  constructor() {
    super();
    this.blackboard = new PlayerAiBlackboard();
    this.behaviorTree = new DefaultPlayerAiBehaviorTree_old();
    this.behaviorTree.init(this, this.blackboard);
  }

  getNextPawnToProduce(): ActorAbleToBeProducedClass | null {
    const ownActors = this.playerState.getOwnActors();

    const acceptableActors = ownActors.filter((actor) => {
      const hasProductionComponent = !!actor.components.findComponentOrNull(ProductionComponent);
      return hasProductionComponent;
    });

    const buildOrder = this.playerState.factionInfo.getBuildOrder();

    // check build order

    return null;
  }

  private getPrimaryResourceDrain(): Actor | null {
    const worldActors = this.gameState.getWorldActors();

    // find first actor with resource drain component
    const primaryResourceDrain =
      worldActors.find((actor) => actor.components.findComponentOrNull(ResourceDrainComponent) !== null) ?? null;
    return primaryResourceDrain;
  }

  private getPrimaryResourceSource(): Actor | null {
    const worldActors = this.gameState.getWorldActors();

    // find all resource sources
    const resourceSources = worldActors.filter((actor) => {
      const resourceSourceComponent = actor.components.findComponentOrNull(ResourceSourceComponent);
      if (!resourceSourceComponent) {
        return false;
      }
      // check resource type
      return resourceSourceComponent.getResourceType() === this.primaryResourceType;
    });
    if (resourceSources.length === 0) {
      return null;
    }

    // find closest resource source
    const primaryResourceDrain = this.getPrimaryResourceDrain();
    if (!primaryResourceDrain) {
      return null;
    }

    const primaryResourceSource = resourceSources.reduce((previous, current) => {
      const previousDistance = GameplayLibrary.getDistanceBetweenActors_OLD(primaryResourceDrain, previous);
      const currentDistance = GameplayLibrary.getDistanceBetweenActors_OLD(primaryResourceDrain, current);
      if (previousDistance === null || currentDistance === null) {
        return previous;
      }
      return previousDistance < currentDistance ? previous : current;
    });
    return primaryResourceSource;
  }

  private canPayFor(costs: any): boolean {
    // todo but check ProductionQueueItem
    return false;
  }

  private meetsAllRequirementsFor(pawnClass: ActorAbleToBeCreatedClass): boolean {
    // todo
    return false;
  }

  /**
   * todo start production by name and not class?? or class and have global dictionary of all classes where values are CharacterDefinitions etc...
   */
  private startProduction(pawnClass: ActorAbleToBeCreatedClass): boolean {
    const ownActors = this.playerState.getOwnActors();

    // get any own building location
    let ownBuilding;
    for (const actor of ownActors) {
      const productionComponent = actor.components.findComponentOrNull(ProductionComponent);
      if (!productionComponent) {
        continue;
      }
      ownBuilding = actor;
      if (!productionComponent.availableProductActorClasses.includes(pawnClass as ActorAbleToBeProducedClass)) {
        continue;
      }

      console.log("starting production of " + pawnClass.name);
      // todo productionComponent.startProduction(pawnClass as ActorsAbleToBeProducedClass);

      // todo ...
      return true;
    }
    // todo ...

    return false;
  }
}
