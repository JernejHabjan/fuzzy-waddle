import { pwActorDefinitions } from "../prefabs/definitions/actor-definitions";
import { type ActorDefinition, ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { VisionComponent } from "../entity/components/vision-component";
import { InfoComponent } from "../entity/components/info-component";
import { ObjectDescriptorComponent } from "../entity/components/object-descriptor-component";
import { OwnerComponent } from "../entity/components/owner-component";
import { IdComponent } from "../entity/components/id-component";
import { SelectableComponent } from "../entity/components/selectable-component";
import { HealthComponent } from "../entity/components/combat/components/health-component";
import { AttackComponent } from "../entity/components/combat/components/attack-component";
import { ProductionCostComponent } from "../entity/components/production/production-cost-component";
import { ContainableComponent } from "../entity/components/building/containable-component";
import { RequirementsComponent } from "../entity/components/requirements-component";
import { BuilderComponent } from "../entity/components/construction/builder-component";
import { GathererComponent } from "../entity/components/resource/gatherer-component";
import { ActorTranslateComponent } from "../entity/components/movement/actor-translate-component";
import { MovementSystem } from "../entity/systems/movement.system";
import { ColliderComponent } from "../entity/components/movement/collider-component";
import { ContainerComponent } from "../entity/components/building/container-component";
import { ResourceDrainComponent } from "../entity/components/resource/resource-drain-component";
import { ProductionComponent } from "../entity/components/production/production-component";
import { ResourceSourceComponent } from "../entity/components/resource/resource-source-component";
import { PawnAiController } from "../prefabs/ai-agents/pawn-ai-controller";
import { ConstructionSiteComponent } from "../entity/components/construction/construction-site-component";
import { getActorComponent } from "./actor-component";
import { DepthHelper } from "../world/services/depth.helper";
import { ActionSystem } from "../entity/systems/action.system";
import { HealingComponent } from "../entity/components/combat/components/healing-component";
import { AudioActorComponent } from "../entity/components/actor-audio/audio-actor-component";
import { AnimationActorComponent } from "../entity/components/animation/animation-actor-component";
import { RepresentableComponent } from "../entity/components/representable-component";
import { FlyingComponent } from "../entity/components/movement/flying-component";
import { WalkableComponent } from "../entity/components/movement/walkable-component";
import GameObject = Phaser.GameObjects.GameObject;
import { HousingComponent } from "../entity/components/building/housing-component";
import { HousingCostComponent } from "../entity/components/building/housing-cost-component";

export const ActorDataKey = "actorData";
export class ActorData {
  constructor(
    public readonly components: Map<new (...args: any[]) => any, any>,
    public readonly systems: Map<new (...args: any[]) => any, any>
  ) {}
}

/**
 * Sets the actor data - appends the components and systems to the actor.
 */
export function setActorData(
  actor: Phaser.GameObjects.GameObject,
  components: any[],
  systems: any[],
  actorDefinition?: Partial<ActorDefinition>
) {
  let actorData = actor.getData(ActorDataKey) as ActorData;
  if (actorData) {
    components.forEach((component) => actorData.components.set(component.constructor, component));
    systems.forEach((system) => actorData.systems.set(system.constructor, system));
  } else {
    const componentMap = new Map(components.map((c) => [c.constructor, c]));
    const systemMap = new Map(systems.map((s) => [s.constructor, s]));
    actorData = new ActorData(componentMap, systemMap);
    actor.setData(ActorDataKey, actorData);
  }
  setActorProperties(actor, actorDefinition);
  actor.emit(ActorDataChangedEvent, actorData);
}

function setActorProperties(actor: GameObject, actorDefinition?: Partial<ActorDefinition>) {
  if (!actorDefinition) return;
  if (actorDefinition.owner) getActorComponent(actor, OwnerComponent)?.setData(actorDefinition.owner);
  if (actorDefinition.selected) getActorComponent(actor, SelectableComponent)?.setData(actorDefinition.selected);
  if (actorDefinition.id) getActorComponent(actor, IdComponent)?.setData(actorDefinition.id);
  if (actorDefinition.constructionSite)
    getActorComponent(actor, ConstructionSiteComponent)?.setData(actorDefinition.constructionSite);
  if (actorDefinition.housing) getActorComponent(actor, HousingComponent)?.setData(actorDefinition.housing);
  if (actorDefinition.health) getActorComponent(actor, HealthComponent)?.setData(actorDefinition.health);
  if (actorDefinition.vision) getActorComponent(actor, VisionComponent)?.setData(actorDefinition.vision);
  if (actorDefinition.attack) getActorComponent(actor, AttackComponent)?.setData(actorDefinition.attack);
  if (actorDefinition.healing) getActorComponent(actor, HealingComponent)?.setData(actorDefinition.healing);
  if (actorDefinition.builder) getActorComponent(actor, BuilderComponent)?.setData(actorDefinition.builder);
  if (actorDefinition.gatherer) getActorComponent(actor, GathererComponent)?.setData(actorDefinition.gatherer);
  if (actorDefinition.container) getActorComponent(actor, ContainerComponent)?.setData(actorDefinition.container);
  if (actorDefinition.resourceDrain)
    getActorComponent(actor, ResourceDrainComponent)?.setData(actorDefinition.resourceDrain);
  if (actorDefinition.resourceSource)
    getActorComponent(actor, ResourceSourceComponent)?.setData(actorDefinition.resourceSource);
  if (actorDefinition.production) getActorComponent(actor, ProductionComponent)?.setData(actorDefinition.production);
  if (actorDefinition.representable)
    getActorComponent(actor, RepresentableComponent)?.setData(actorDefinition.representable);
  if (actorDefinition.blackboard) getActorComponent(actor, PawnAiController)?.setData(actorDefinition.blackboard);

  DepthHelper.setActorDepth(actor);
}

function gatherCoreActorData(actor: Phaser.GameObjects.GameObject): { components: any[]; systems: any[] } {
  const definition = pwActorDefinitions[actor.name as ObjectNames];
  if (!definition) {
    throw new Error(`Actor definition for ${actor.name} not found.`);
  }

  const componentDefinitions = definition.components;
  const components = [
    new IdComponent(),
    ...(componentDefinitions?.objectDescriptor
      ? [new ObjectDescriptorComponent(componentDefinitions.objectDescriptor)]
      : []),
    ...(componentDefinitions?.representable
      ? [new RepresentableComponent(actor, componentDefinitions.representable)]
      : []),
    ...(componentDefinitions?.requirements
      ? [new RequirementsComponent(actor, componentDefinitions.requirements)]
      : []),
    ...(componentDefinitions?.productionCost
      ? [new ProductionCostComponent(actor, componentDefinitions.productionCost)]
      : []),
    ...(componentDefinitions?.housingCost ? [new HousingCostComponent(actor, componentDefinitions.housingCost)] : []),
    ...(componentDefinitions?.housing ? [new HousingComponent(actor, componentDefinitions.housing)] : []),
    ...(componentDefinitions?.audio ? [new AudioActorComponent(actor, componentDefinitions.audio)] : [])
  ];

  return { components, systems: [] };
}

function gatherConstructingActorData(actor: Phaser.GameObjects.GameObject): { components: any[]; systems: any[] } {
  const definition = pwActorDefinitions[actor.name as ObjectNames];
  if (!definition) {
    throw new Error(`Actor definition for ${actor.name} not found.`);
  }

  const componentDefinitions = definition.components;
  const components = [
    ...(componentDefinitions?.owner ? [new OwnerComponent(actor, componentDefinitions.owner)] : []),
    ...(componentDefinitions?.vision ? [new VisionComponent(actor, componentDefinitions.vision)] : []),
    ...(componentDefinitions?.info ? [new InfoComponent(componentDefinitions.info)] : []),
    ...(componentDefinitions?.constructable
      ? [new ConstructionSiteComponent(actor, componentDefinitions.constructable)]
      : []),
    ...(componentDefinitions?.production ? [new ProductionComponent(actor, componentDefinitions.production)] : []),
    ...(componentDefinitions?.selectable ? [new SelectableComponent(actor, componentDefinitions.selectable)] : []),
    ...(componentDefinitions?.health ? [new HealthComponent(actor, componentDefinitions.health)] : []),
    ...(componentDefinitions?.collider ? [new ColliderComponent(actor, componentDefinitions.collider)] : [])
  ];

  return { components, systems: [] };
}

function gatherCompletedActorData(actor: Phaser.GameObjects.GameObject): { components: any[]; systems: any[] } {
  const definition = pwActorDefinitions[actor.name as ObjectNames];
  if (!definition) {
    throw new Error(`Actor definition for ${actor.name} not found.`);
  }

  const componentDefinitions = definition.components;
  const components = [
    ...(componentDefinitions?.attack ? [new AttackComponent(actor, componentDefinitions.attack)] : []),
    ...(componentDefinitions?.containable ? [new ContainableComponent(actor)] : []),
    ...(componentDefinitions?.container ? [new ContainerComponent(actor, componentDefinitions.container)] : []),
    ...(componentDefinitions?.resourceDrain
      ? [new ResourceDrainComponent(actor, componentDefinitions.resourceDrain)]
      : []),
    ...(componentDefinitions?.resourceSource
      ? [new ResourceSourceComponent(actor, componentDefinitions.resourceSource)]
      : []),
    ...(componentDefinitions?.healing ? [new HealingComponent(actor, componentDefinitions.healing)] : []),
    ...(componentDefinitions?.builder ? [new BuilderComponent(actor, componentDefinitions.builder)] : []),
    ...(componentDefinitions?.gatherer ? [new GathererComponent(actor, componentDefinitions.gatherer)] : []),
    ...(componentDefinitions?.translatable
      ? [new ActorTranslateComponent(actor, componentDefinitions.translatable)]
      : []),
    ...(componentDefinitions?.flying ? [new FlyingComponent(actor, componentDefinitions.flying)] : []),
    ...(componentDefinitions?.walkable ? [new WalkableComponent(actor, componentDefinitions.walkable)] : []),
    ...(componentDefinitions?.animatable ? [new AnimationActorComponent(actor, componentDefinitions.animatable)] : []),
    ...(componentDefinitions?.aiControlled ? [new PawnAiController(actor, componentDefinitions.aiControlled)] : [])
  ];

  const systemDefinitions = definition.systems;
  const systems = [
    ...(systemDefinitions?.movement ? [new MovementSystem(actor)] : []),
    ...(systemDefinitions?.action ? [new ActionSystem(actor)] : [])
  ];
  return { components, systems };
}

function gatherFullActorData(actor: Phaser.GameObjects.GameObject): { components: any[]; systems: any[] } {
  const coreData = gatherCoreActorData(actor);
  const mandatoryData = gatherConstructingActorData(actor);
  const completedActorData = gatherCompletedActorData(actor);
  return {
    components: [...coreData.components, ...mandatoryData.components, ...completedActorData.components],
    systems: [...coreData.systems, ...mandatoryData.systems, ...completedActorData.systems]
  };
}

export function setCoreActorDataFromName(
  actor: Phaser.GameObjects.GameObject,
  actorDefinition?: Partial<ActorDefinition>
) {
  const { components, systems } = gatherCoreActorData(actor);
  setActorData(actor, components, systems, actorDefinition);
}

export function setConstructingActorDataFromName(
  actor: Phaser.GameObjects.GameObject,
  actorDefinition?: Partial<ActorDefinition>
) {
  const { components, systems } = gatherConstructingActorData(actor);
  setActorData(actor, components, systems, actorDefinition);
}

export function setFullActorDataFromName(
  actor: Phaser.GameObjects.GameObject,
  actorDefinition?: Partial<ActorDefinition>
) {
  const actorData = gatherFullActorData(actor);
  setActorData(actor, actorData.components, actorData.systems, actorDefinition);
}

export function upgradeFromCoreToConstructingActorData(
  actor: Phaser.GameObjects.GameObject,
  actorDefinition?: Partial<ActorDefinition>
) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  if (!actorData) {
    setConstructingActorDataFromName(actor, actorDefinition);
    return;
  }

  const upgradeData = gatherConstructingActorData(actor);
  for (const component of upgradeData.components) {
    actorData.components.set(component.constructor, component);
  }
  for (const system of upgradeData.systems) {
    actorData.systems.set(system.constructor, system);
  }

  setActorProperties(actor, actorDefinition);

  actor.emit(ActorDataChangedEvent, actorData);
}

export function upgradeFromConstructingToFullActorData(
  actor: Phaser.GameObjects.GameObject,
  actorDefinition?: Partial<ActorDefinition>
) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  if (!actorData) {
    setFullActorDataFromName(actor, actorDefinition);
    return;
  }

  const upgradeData = gatherCompletedActorData(actor);
  for (const component of upgradeData.components) {
    actorData.components.set(component.constructor, component);
  }
  for (const system of upgradeData.systems) {
    actorData.systems.set(system.constructor, system);
  }

  setActorProperties(actor, actorDefinition);

  actor.emit(ActorDataChangedEvent, actorData);
}

export function addActorComponent(
  actor: Phaser.GameObjects.GameObject,
  component: any,
  actorDefinition?: Partial<ActorDefinition>
) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  actorData.components.set(component.constructor, component);
  setActorProperties(actor, actorDefinition);
  actor.emit(ActorDataChangedEvent, actorData);
}

export function addActorSystem(
  actor: Phaser.GameObjects.GameObject,
  system: any,
  actorDefinition?: Partial<ActorDefinition>
) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  actorData.systems.set(system.constructor, system);
  setActorProperties(actor, actorDefinition);
  actor.emit(ActorDataChangedEvent, actorData);
}

export function removeActorComponent(
  actor: Phaser.GameObjects.GameObject,
  component: any,
  actorDefinition?: Partial<ActorDefinition>
) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  actorData.components.delete(component.constructor);
  setActorProperties(actor, actorDefinition);
  actor.emit(ActorDataChangedEvent, actorData);
}

export function removeActorSystem(
  actor: Phaser.GameObjects.GameObject,
  system: any,
  actorDefinition?: Partial<ActorDefinition>
) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  actorData.systems.delete(system.constructor);
  setActorProperties(actor, actorDefinition);
  actor.emit(ActorDataChangedEvent, actorData);
}

export const ActorDataChangedEvent = "actorDataChanged";
