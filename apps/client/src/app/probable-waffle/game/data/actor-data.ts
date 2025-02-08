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

export const ActorDataKey = "actorData";
export class ActorData {
  constructor(
    public readonly components: any[],
    public readonly systems: any[]
  ) {}
}

export function setActorData(actor: Phaser.GameObjects.GameObject, components: any[], systems: any[]) {
  actor.setData(ActorDataKey, new ActorData(components, systems));
}

function gatherMandatoryActorData(actor: Phaser.GameObjects.GameObject): { components: any[]; systems: any[] } {
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
    ...(componentDefinitions?.owner ? [new OwnerComponent(actor, componentDefinitions.owner)] : []),
    ...(componentDefinitions?.vision ? [new VisionComponent(actor, componentDefinitions.vision)] : []),
    ...(componentDefinitions?.info ? [new InfoComponent(componentDefinitions.info)] : []),
    ...(componentDefinitions?.constructable
      ? [new ConstructionSiteComponent(actor, componentDefinitions.constructable)]
      : []),
    ...(componentDefinitions?.requirements ? [new RequirementsComponent(actor, componentDefinitions.requirements)] : [])
  ];

  return { components, systems: [] };
}

function gatherUpgradeActorData(actor: Phaser.GameObjects.GameObject): { components: any[]; systems: any[] } {
  const definition = pwActorDefinitions[actor.name as ObjectNames];
  if (!definition) {
    throw new Error(`Actor definition for ${actor.name} not found.`);
  }

  const componentDefinitions = definition.components;
  const components = [
    ...(componentDefinitions?.selectable ? [new SelectableComponent(actor)] : []),
    ...(componentDefinitions?.health ? [new HealthComponent(actor, componentDefinitions.health)] : []),
    ...(componentDefinitions?.attack ? [new AttackComponent(actor, componentDefinitions.attack)] : []),
    ...(componentDefinitions?.productionCost
      ? [new ProductionCostComponent(actor, componentDefinitions.productionCost)]
      : []),
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
    ...(componentDefinitions?.collider ? [new ColliderComponent(componentDefinitions.collider)] : []),
    ...(componentDefinitions?.aiControlled ? [new PawnAiController(actor, componentDefinitions.aiControlled)] : [])
  ];

  const systemDefinitions = definition.systems;
  const systems = [...(systemDefinitions?.movement ? [new MovementSystem(actor)] : [])];
  return { components, systems };
}

function gatherFullActorData(actor: Phaser.GameObjects.GameObject): { components: any[]; systems: any[] } {
  const mandatoryData = gatherMandatoryActorData(actor);
  const upgradeData = gatherUpgradeActorData(actor);
  return {
    components: [...mandatoryData.components, ...upgradeData.components],
    systems: [...mandatoryData.systems, ...upgradeData.systems]
  };
}

export function setMandatoryActorDataFromName(actor: Phaser.GameObjects.GameObject) {
  const { components, systems } = gatherMandatoryActorData(actor);
  setActorData(actor, components, systems);
}

export function setFullActorDataFromName(actor: Phaser.GameObjects.GameObject) {
  const actorData = gatherFullActorData(actor);
  setActorData(actor, actorData.components, actorData.systems);
  actor.emit(ActorDataAddedEvent, actorData);
}

export function upgradeFromMandatoryToFullActorData(actor: Phaser.GameObjects.GameObject) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  if (!actorData) {
    setFullActorDataFromName(actor);
    return;
  }

  const upgradeData = gatherUpgradeActorData(actor);
  actorData.components.push(...upgradeData.components);
  actorData.systems.push(...upgradeData.systems);
  actor.emit(ActorDataAddedEvent, actorData);
}

export function addActorComponent(actor: Phaser.GameObjects.GameObject, component: any) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  actorData.components.push(component);
  actor.emit(ActorDataAddedEvent, actorData);
}

export function addActorSystem(actor: Phaser.GameObjects.GameObject, system: any) {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  actorData.systems.push(system);
  actor.emit(ActorDataAddedEvent, actorData);
}

export const ActorDataAddedEvent = "actorDataAdded";
