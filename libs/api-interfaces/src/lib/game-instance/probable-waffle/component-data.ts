import { Vector3Simple } from "../../game/vector";
import { ResourceType } from "../../probable-waffle/resource-type-definition";
import { ObjectNames } from "./object-names";

export interface VisionComponentData {
  visibilityByCurrentPlayer?: boolean;
}

export interface AttackComponentData {
  remainingCooldown?: number;
  currentAttackIndex?: number;
}

export interface HealingComponentData {
  remainingCooldown?: number;
}

export interface BuilderComponentData {
  remainingCooldown?: number;
  enterConstructionSite?: boolean;
  constructionSiteOffset?: number;
  assignedConstructionSiteId?: string;
}

export interface GathererComponentData {
  carriedResourceAmount?: number;
  carriedResourceType?: ResourceType | null;
  remainingCooldown?: number;
}

export interface ContainerComponentData {
  containedIds?: string[];
}

export interface ResourceDrainComponentData {
  currentCapacity?: number;
}

export interface ResourceSourceComponentData {
  currentResources?: number;
}

export interface ProductionComponentData {
  queue?: ObjectNames[];
  isProducing?: boolean;
  progress?: number;
  rallyPoint?: RallyPointComponentData;
}

export interface RallyPointComponentData {
  tileVec3?: Vector3Simple;
  worldVec3?: Vector3Simple;
  actorId?: string;
}

export interface ActorTranslateComponentData {
  x?: number;
  y?: number;
  z?: number;
  facingAngle?: number;
}

export interface WalkableComponentData {
  speed?: number;
  pathingRadius?: number;
}

export interface RepresentableComponentData {
  logicalWorldTransform?: Vector3Simple;
}

export interface OwnerComponentData {
  ownerId?: number;
}

export interface SelectableComponentData {
  selected?: boolean;
}

export interface IdComponentData {
  id?: string;
}

export interface BackboardComponentData {
  blackboard: Record<string, any>;
}
