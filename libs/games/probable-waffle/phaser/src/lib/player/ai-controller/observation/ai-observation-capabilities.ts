import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiDomainV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";

export function movementDomains(definition: ReturnType<typeof getPwActorDefinition>): AiDomainV1[] {
  if (!definition) return [];
  if (definition.components?.flying) return ["air"];
  switch (definition.components?.translatable?.movementTerrainType) {
    case MovementTerrainType.Water:
      return ["water"];
    case MovementTerrainType.Amphibious:
      return ["ground", "water"];
    case MovementTerrainType.Air:
      return ["air"];
    default:
      return definition.components?.translatable || definition.components?.navigable ? ["ground"] : [];
  }
}

export function targetDomains(definition: ReturnType<typeof getPwActorDefinition>): AiDomainV1[] {
  const attacks = definition?.components?.attack?.attacks ?? [];
  if (attacks.length === 0) return [];
  return attacks.some((attack) => attack.canTargetAir) ? ["ground", "water", "air"] : ["ground", "water"];
}

export function capabilityFamilies(definition: ReturnType<typeof getPwActorDefinition>): string[] {
  if (!definition) return [];
  const components = definition.components ?? {};
  return [
    components.attack ? "attack" : null,
    components.healing ? "heal" : null,
    components.spell ? "spell" : null,
    components.gatherer ? "gather" : null,
    components.builder ? "build" : null,
    components.production ? "produce" : null,
    components.resourceDrain ? "drop_off" : null,
    components.container ? "transport" : null
  ].filter((family): family is string => family !== null);
}

/** Keeps runtime gather capabilities inside the protocol's finite resource domain. */
export function normalizeGatherResourceTypes(values: readonly string[] | undefined): ResourceType[] {
  const resourceTypes = new Set(Object.values(ResourceType));
  return (values ?? []).filter((value): value is ResourceType => resourceTypes.has(value as ResourceType)).sort();
}
