import Phaser from "phaser";
import { type ActorDefinition, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "./actor-component";
import { OwnerComponent } from "../entity/components/owner-component";
import { SelectableComponent } from "../entity/components/selectable-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { setConstructingActorDataFromName, setCoreActorDataFromName, setFullActorDataFromName } from "./actor-data";
import { ConstructionSiteComponent } from "../entity/components/construction/construction-site-component";
import { HealthComponent } from "../entity/components/combat/components/health-component";
import { getPwActorDefinition } from "../prefabs/definitions/actor-definitions";
import { RepresentableComponent } from "../entity/components/representable-component";
import { VisionComponent } from "../entity/components/vision-component";
import { AttackComponent } from "../entity/components/combat/components/attack-component";
import { HealingComponent } from "../entity/components/combat/components/healing-component";
import { BuilderComponent } from "../entity/components/construction/builder-component";
import { GathererComponent } from "../entity/components/resource/gatherer-component";
import { ContainerComponent } from "../entity/components/building/container-component";
import { ResourceDrainComponent } from "../entity/components/resource/resource-drain-component";
import { ResourceSourceComponent } from "../entity/components/resource/resource-source-component";
import { ProductionComponent } from "../entity/components/production/production-component";
import { PawnAiController } from "../prefabs/ai-agents/pawn-ai-controller";
import { HousingComponent } from "../entity/components/building/housing-component";
import { getSceneService } from "../world/services/scene-component-helpers";
import { SceneActorCreator } from "../world/services/scene-actor-creator";
import { SpellComponent } from "../entity/components/combat/components/spell-component";
import { StatusEffectComponent } from "../entity/components/status-effect/status-effect-component";
import { ResearchComponent } from "../entity/components/research/research-component";
import { LevelComponent } from "../entity/components/level/level-component";
import { RandomService } from "../world/services/random.service";
import { ScenarioActorReferenceComponent } from "../campaign/scenario/scenario-actor-reference.component";
import { TendableComponent } from "../entity/components/tendable/tendable-component";
import { ConvertibleComponent } from "../entity/components/convertible-component";
import { actorPrefabs } from "./actor-prefabs";
type GameObject = Phaser.GameObjects.GameObject;

export class ActorManager {
  public static actorMap = actorPrefabs;

  static getActorDefinitionFromActor(actor: GameObject): ActorDefinition | undefined {
    const actorName = actor.name as ObjectNames;
    if (!this.actorMap[actorName]) {
      // console.error(`Actor ${actorName} not found`);
      return undefined;
    }
    // noinspection UnnecessaryLocalVariableJS
    const actorDefinition: ActorDefinition = {
      name: actorName,
      owner: getActorComponent(actor, OwnerComponent)?.getData(),
      selected: getActorComponent(actor, SelectableComponent)?.getData(),
      id: getActorComponent(actor, IdComponent)?.getData(),
      scenario: getActorComponent(actor, ScenarioActorReferenceComponent)?.getData(),
      constructionSite: getActorComponent(actor, ConstructionSiteComponent)?.getData(),
      health: getActorComponent(actor, HealthComponent)?.getData(),
      housing: getActorComponent(actor, HousingComponent)?.getData(),
      vision: getActorComponent(actor, VisionComponent)?.getData(),
      attack: getActorComponent(actor, AttackComponent)?.getData(),
      healing: getActorComponent(actor, HealingComponent)?.getData(),
      builder: getActorComponent(actor, BuilderComponent)?.getData(),
      gatherer: getActorComponent(actor, GathererComponent)?.getData(),
      container: getActorComponent(actor, ContainerComponent)?.getData(),
      resourceDrain: getActorComponent(actor, ResourceDrainComponent)?.getData(),
      resourceSource: getActorComponent(actor, ResourceSourceComponent)?.getData(),
      production: getActorComponent(actor, ProductionComponent)?.getData(),
      research: getActorComponent(actor, ResearchComponent)?.getData(),
      representable: getActorComponent(actor, RepresentableComponent)?.getData(),
      blackboard: getActorComponent(actor, PawnAiController)?.getData(),
      spell: getActorComponent(actor, SpellComponent)?.getData(),
      statusEffects: getActorComponent(actor, StatusEffectComponent)?.getData(),
      level: getActorComponent(actor, LevelComponent)?.getData(),
      tendable: getActorComponent(actor, TendableComponent)?.getData(),
      convertible: getActorComponent(actor, ConvertibleComponent)?.getData()
    } satisfies ActorDefinition;

    return actorDefinition;
  }

  static createActorFully(scene: Phaser.Scene, name: ObjectNames, actorDefinition: ActorDefinition): GameObject {
    const definition = getPwActorDefinition(name, null);
    if (!definition) {
      throw new Error(`Actor definition for ${name} not found.`);
    }

    if (definition.meta?.randomOfType?.length) {
      // If the actor definition has a randomOfType, we need to pick a random one from the list
      const randomService = getSceneService(scene, RandomService)!;
      name = randomService.pick(definition.meta.randomOfType) as ObjectNames;
    }

    let actor: GameObject | undefined = undefined;
    const actorConstructor = this.actorMap[name];
    if (!actorConstructor) {
      console.error(`Actor ${name} not found`);
      throw new Error(`Actor ${name} not found`);
    }
    actor = new actorConstructor(scene);
    setFullActorDataFromName(actor, actorDefinition);
    return actor;
  }

  /**
   * Used for spawning actors that are just shells, without any specific components and systems.
   * Use {@link upgradeFromCoreToConstructingActorData} to upgrade the actor to a constructing actor.
   * Use this method when you are using {@link BuildingCursor}
   */
  static createActorCore(
    scene: Phaser.Scene,
    name: ObjectNames,
    actorDefinition: Partial<ActorDefinition>
  ): GameObject {
    let actor: GameObject | undefined = undefined;
    const actorConstructor = this.actorMap[name];
    if (!actorConstructor) {
      console.error(`Actor ${name} not found`);
      throw new Error(`Actor ${name} not found`);
    }
    actor = new actorConstructor(scene);
    setCoreActorDataFromName(actor, actorDefinition);
    const sceneActorCreator = getSceneService(scene, SceneActorCreator);
    if (!sceneActorCreator) {
      throw new Error("SceneActorCreator not found in scene");
    }
    sceneActorCreator.registerAndSaveNewActor(actor, actorDefinition.id?.id);
    return actor;
  }

  /**
   * Used when skipping building cursor, and you want to create foundation actor.
   * Use {@link upgradeFromConstructingToFullActorData} to upgrade the actor to a fully functioning actor.
   */
  static createActorConstructing(
    scene: Phaser.Scene,
    name: ObjectNames,
    actorDefinition: Partial<ActorDefinition>
  ): GameObject {
    let actor: GameObject | undefined = undefined;
    const actorConstructor = this.actorMap[name];
    if (!actorConstructor) {
      console.error(`Actor ${name} not found`);
      throw new Error(`Actor ${name} not found`);
    }
    actor = new actorConstructor(scene);
    setCoreActorDataFromName(actor, actorDefinition);
    setConstructingActorDataFromName(actor, actorDefinition);

    const sceneActorCreator = getSceneService(scene, SceneActorCreator);
    if (!sceneActorCreator) {
      throw new Error("SceneActorCreator not found in scene");
    }
    sceneActorCreator.registerAndSaveNewActor(actor, actorDefinition.id?.id);
    return actor;
  }
}
