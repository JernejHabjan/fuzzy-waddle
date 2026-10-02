import Phaser from "phaser";
import { type ObjectNames, type ProbableWafflePlayer, type ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogEntryV1, AiObservedActorV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { getActorComponent } from "../../../data/actor-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { ResearchComponent } from "../../../entity/components/research/research-component";
import { BuilderComponent } from "../../../entity/components/construction/builder-component";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { getSceneComponent, getSceneService } from "../../../world/services/scene-component-helpers";
import { TilemapComponent } from "../../../world/tilemap/tilemap.component";
import {
  capabilityFamilies,
  movementDomains,
  normalizeGatherResourceTypes,
  targetDomains
} from "./ai-observation-capabilities";
import { knownValue } from "./ai-observation-values";
import { projectAiProductionTiming } from "./ai-production-timing";

type GameObject = Phaser.GameObjects.GameObject;

export function projectActorCapabilities(
  objectName: ObjectNames,
  definition: ReturnType<typeof getPwActorDefinition>,
  level: number
): AiObservedActorV1["capabilities"] {
  if (!definition) return [];
  const families = capabilityFamilies(definition);
  const domains = movementDomains(definition);
  const supportedTargetDomains = targetDomains(definition);
  return families.map((family) => ({
    id: `${objectName}:${family}:${level}`,
    family,
    level,
    domains,
    targetDomains: supportedTargetDomains,
    capacity: knownValue(definition.components?.container?.capacity ?? 0, 0)
  }));
}

export function projectCatalogEntry(
  actor: GameObject,
  level: number,
  scene: Phaser.Scene
): AiCapabilityCatalogEntryV1 | undefined {
  const objectName = actor.name as ObjectNames;
  const definition = getPwActorDefinition(objectName, level);
  if (!definition) return undefined;
  return projectCatalogDefinition(
    scene,
    objectName,
    definition,
    level,
    getActorComponent(actor, ResearchComponent)?.availableResearch ?? []
  );
}

/** Adds legal current-tech options from the runtime graph without copying balance data into AI code. */
export function projectAvailableCatalogEntries(
  scene: Phaser.Scene,
  player: ProbableWafflePlayer,
  playerNumber: number,
  catalogEntries: Map<string, AiCapabilityCatalogEntryV1>
): void {
  const techTree = getSceneService(scene, TechTreeService);
  if (!techTree) return;
  // Never enumerate the global graph here: that would expose another faction's
  // roster even when no opponent actor has been observed.
  for (const objectName of techTree.getFactionActorIds(player.factionType!)) {
    if (!techTree.isAvailable(playerNumber, objectName)) continue;
    const level = techTree.getResearchedLevelForUnit(playerNumber, objectName);
    const definition = getPwActorDefinition(objectName, level);
    if (!definition) continue;
    const entry = projectCatalogDefinition(
      scene,
      objectName,
      definition,
      level,
      definition.components?.research?.availableResearch ?? []
    );
    catalogEntries.set(entry.capabilityId, entry);
  }
}

export function projectCatalogDefinition(
  scene: Phaser.Scene,
  objectName: ObjectNames,
  definition: NonNullable<ReturnType<typeof getPwActorDefinition>>,
  level: number,
  researches: readonly ResearchType[]
): AiCapabilityCatalogEntryV1 {
  return {
    capabilityId: `${objectName}:level:${level}`,
    family:
      [
        ...capabilityFamilies(definition),
        definition.components?.attack?.attacks.some((attack) => attack.range >= 4) ? "ranged" : null
      ]
        .filter((family): family is string => family !== null)
        .join("+") || "passive",
    sourceObjectName: objectName,
    effectiveLevel: level,
    movementDomains: movementDomains(definition),
    targetDomains: targetDomains(definition),
    produces: [...(definition.components?.production?.availableProduceActors ?? [])].sort(),
    constructs: definition.components?.builder
      ? [...BuilderComponent.getFlatConstructableBuildings(definition.components.builder.constructableBuildings)].sort()
      : [],
    researches: [...researches].sort(),
    gathers: normalizeGatherResourceTypes(definition.components?.gatherer?.resourceSourceGameObjectClasses),
    acceptsResources: [...(definition.components?.resourceDrain?.resourceTypes ?? [])].sort(),
    housingCapacity: definition.components?.housing?.housingCapacity ?? null,
    housingCost: definition.components?.housingCost?.housingNeeded ?? null,
    cargoCapacity: definition.components?.container?.capacity ?? null,
    ...(definition.components?.productionCost
      ? {
          productionTiming: projectAiProductionTiming(
            definition.components.productionCost,
            definition.components.constructable,
            getPwActorDefinition(objectName, null)?.components?.queue?.queueCount ?? 1
          )
        }
      : {}),
    constructionProfile: {
      resourceCost: { ...(definition.components?.productionCost?.resources ?? {}) },
      requiredObjectNames: [...(definition.components?.requirements?.actors ?? [])].sort(),
      footprintRadiusTiles: Math.floor(
        ((definition.components?.representable?.width ?? 0) *
          (definition.components?.collider?.colliderFactorReduction || 1)) /
          (getSceneComponent(scene, TilemapComponent)?.tilemap?.tileWidth ?? TilemapComponent.tileWidth) /
          2
      ),
      visionRange: definition.components?.vision?.range ?? null,
      navigableHeight: definition.components?.navigable?.navigableHeight ?? null,
      enterHeight: definition.components?.navigable?.enterHeight ?? null,
      exitHeight: definition.components?.navigable?.exitHeight ?? null
    }
  };
}
