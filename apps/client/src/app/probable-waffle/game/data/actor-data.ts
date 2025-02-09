import { pwActorDefinitions } from "./actor-definitions";
import { ObjectNames } from "./object-names";
import { VisionComponent } from "../entity/actor/components/vision-component";
import { InfoComponent } from "../entity/actor/components/info-component";
import { ObjectDescriptorComponent } from "../entity/actor/components/object-descriptor-component";
import { OwnerComponent } from "../entity/actor/components/owner-component";
import { IdComponent } from "../entity/actor/components/id-component";
import { SelectableComponent } from "../entity/actor/components/selectable-component";
import { HealthComponent } from "../entity/combat/components/health-component";
import { AttackComponent } from "../entity/combat/components/attack-component";
import { ProductionCostComponent } from "../entity/building/production/production-cost-component";
import { ContainableComponent } from "../entity/actor/components/containable-component";
import { RequirementsComponent } from "../entity/actor/components/requirements-component";
import { BuilderComponent } from "../entity/actor/components/builder-component";
import { GathererComponent } from "../entity/actor/components/gatherer-component";
import { ActorTranslateComponent } from "../entity/actor/components/actor-translate-component";
import { MovementSystem } from "../entity/systems/movement.system";
import { ColliderComponent } from "../entity/actor/components/collider-component";
import { ContainerComponent } from "../entity/building/container-component";
import { ResourceDrainComponent } from "../entity/economy/resource/resource-drain-component";
import { ProductionComponent } from "../entity/building/production/production-component";
import { ResourceSourceComponent } from "../entity/economy/resource/resource-source-component";
import { PawnAiController } from "../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import { ConstructionSiteComponent } from "../entity/building/construction/construction-site-component";
import { ActorDefinition } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "./actor-component";
import { DepthHelper } from "../world/map/depth.helper";
import GameObject = Phaser.GameObjects.GameObject;
import Transform = Phaser.GameObjects.Components.Transform;

export const ActorDataKey = "actorData";
export class ActorData {
  constructor(
    public readonly components: any[],
    public readonly systems: any[]
  ) {}
}

export function setActorData(
  actor: Phaser.GameObjects.GameObject,
  components: any[],
  systems: any[],
  actorDefinition?: Partial<ActorDefinition>
) {
  const actorData = new ActorData(components, systems);
  actor.setData(ActorDataKey, actorData);
  setActorProperties(actor, actorDefinition);
  actor.emit(ActorDataChangedEvent, actorData);
}

function setActorProperties(actor: GameObject, actorDefinition?: Partial<ActorDefinition>) {
  if (!actorDefinition) return;
  const transform = actor as any as Transform;
  if (transform.x !== undefined && actorDefinition.x !== undefined) transform.x = actorDefinition.x;
  if (transform.y !== undefined && actorDefinition.y !== undefined) transform.y = actorDefinition.y;
  if (transform.z !== undefined && actorDefinition.z !== undefined) transform.z = actorDefinition.z;
  if (actorDefinition.owner) getActorComponent(actor, OwnerComponent)?.setOwner(actorDefinition.owner);
  if (actorDefinition.selectable)
    getActorComponent(actor, SelectableComponent)?.setSelected(actorDefinition.selectable);
  if (actorDefinition.id) getActorComponent(actor, IdComponent)?.setId(actorDefinition.id);
  if (actorDefinition.constructionSite)
    getActorComponent(actor, ConstructionSiteComponent)?.setData(actorDefinition.constructionSite);
  if (actorDefinition.health) getActorComponent(actor, HealthComponent)?.setData(actorDefinition.health);
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
    ...(componentDefinitions?.requirements
      ? [new RequirementsComponent(actor, componentDefinitions.requirements)]
      : []),
    ...(componentDefinitions?.productionCost
      ? [new ProductionCostComponent(actor, componentDefinitions.productionCost)]
      : [])
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
    ...(componentDefinitions?.selectable ? [new SelectableComponent(actor)] : []),
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
    ...(componentDefinitions?.production ? [new ProductionComponent(actor, componentDefinitions.production)] : []),
    ...(componentDefinitions?.builder ? [new BuilderComponent(actor, componentDefinitions.builder)] : []),
    ...(componentDefinitions?.gatherer ? [new GathererComponent(actor, componentDefinitions.gatherer)] : []),
    ...(componentDefinitions?.translatable
      ? [new ActorTranslateComponent(actor, componentDefinitions.translatable)]
      : []),
    ...(componentDefinitions?.aiControlled ? [new PawnAiController(actor, componentDefinitions.aiControlled)] : [])
  ];

  const systemDefinitions = definition.systems;
  const systems = [...(systemDefinitions?.movement ? [new MovementSystem(actor)] : [])];
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
  actorData.components.push(...upgradeData.components);
  actorData.systems.push(...upgradeData.systems);

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
  actorData.components.push(...upgradeData.components);
  actorData.systems.push(...upgradeData.systems);

  setActorProperties(actor, actorDefinition);

  actor.emit(ActorDataChangedEvent, actorData);
}

export function addActorComponent(
  actor: Phaser.GameObjects.GameObject,
  component: any,
  actorDefinition?: Partial<ActorDefinition>
) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  actorData.components.push(component);
  setActorProperties(actor, actorDefinition);
  actor.emit(ActorDataChangedEvent, actorData);
}

export function addActorSystem(
  actor: Phaser.GameObjects.GameObject,
  system: any,
  actorDefinition?: Partial<ActorDefinition>
) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  actorData.systems.push(system);
  setActorProperties(actor, actorDefinition);
  actor.emit(ActorDataChangedEvent, actorData);
}

export function removeActorComponent(
  actor: Phaser.GameObjects.GameObject,
  component: any,
  actorDefinition?: Partial<ActorDefinition>
) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  const index = actorData.components.indexOf(component);
  if (index >= 0) {
    actorData.components.splice(index, 1);
  }
  setActorProperties(actor, actorDefinition);
  actor.emit(ActorDataChangedEvent, actorData);
}

export function removeActorSystem(
  actor: Phaser.GameObjects.GameObject,
  system: any,
  actorDefinition?: Partial<ActorDefinition>
) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  const index = actorData.systems.indexOf(system);
  if (index >= 0) {
    actorData.systems.splice(index, 1);
  }
  setActorProperties(actor, actorDefinition);
  actor.emit(ActorDataChangedEvent, actorData);
}

export const ActorDataChangedEvent = "actorDataChanged";
