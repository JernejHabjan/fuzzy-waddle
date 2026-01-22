import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { type BuildingPrerequisitesDefinition } from "../../data/tech-tree/actor-prerequisites";
import type { InfoDefinition } from "../../entity/components/info-definition";
import type { ObjectDescriptorDefinition } from "../../entity/components/object-descriptor-definition";
import type { RepresentableDefinition } from "../../entity/components/representable-definition";
import type { VisionDefinition } from "../../entity/components/vision-definition";
import type { AudioDefinition } from "../../entity/components/actor-audio/audio-definition";
import type { ActorAnimationsDefinition } from "../../entity/components/animation/actor-animations-definition";
import type { ActorTranslateDefinition } from "../../entity/components/movement/actor-translate-definition";
import type { ColliderDefinition } from "../../entity/components/movement/collider-definition";
import type { FlightDefinition } from "../../entity/components/movement/flight-definition";
import type { WalkableDefinition } from "../../entity/components/movement/walkable-definition";
import type { PawnAiDefinition } from "../ai-agents/pawn-ai-definition";
import type { OwnerDefinition } from "../../entity/components/owner-definition";
import type { RequirementsDefinition } from "../../entity/components/requirements-definition";
import type { SelectableDefinition } from "../../entity/components/selectable-definition";
import type { ContainerDefinition } from "../../entity/components/building/container-definition";
import type { HousingDefinition } from "../../entity/components/building/housing-definition";
import type { HousingCostDefinition } from "../../entity/components/building/housing-cost-definition";
import type { AttackDefinition } from "../../entity/components/combat/components/attack-definition";
import type { HealingDefinition } from "../../entity/components/combat/components/healing-definition";
import type { HealthDefinition } from "../../entity/components/combat/components/health-definition";
import type { BuilderDefinition } from "../../entity/components/construction/builder-definition";
import type { ConstructionSiteDefinition } from "../../entity/components/construction/construction-site-definition";
import type { ProductionDefinition } from "../../entity/components/production/production-definition";
import type { ProductionCostDefinition } from "../../entity/components/production/production-cost-definition";
import type { GathererDefinition } from "../../entity/components/resource/gatherer-definition";
import type { ResourceDrainDefinition } from "../../entity/components/resource/resource-drain-definition";
import type { ResourceSourceDefinition } from "../../entity/components/resource/resource-source-definition";
import type { SpellDefinition } from "../../entity/components/combat/spell-definition";
import type { ResearchDefinition } from "../../entity/components/research/research-component";

export type PrefabDefinition = Partial<{
  components: Partial<{
    objectDescriptor: ObjectDescriptorDefinition;
    representable: RepresentableDefinition;
    owner: OwnerDefinition;
    vision: VisionDefinition;
    info: InfoDefinition;
    health: HealthDefinition;
    attack: AttackDefinition;
    productionCost: ProductionCostDefinition;
    housingCost: HousingCostDefinition;
    housing: HousingDefinition;
    requirements: RequirementsDefinition;
    builder: BuilderDefinition;
    constructable: ConstructionSiteDefinition;
    walkable: WalkableDefinition;
    gatherer: GathererDefinition;
    container: ContainerDefinition;
    resourceDrain: ResourceDrainDefinition;
    resourceSource: ResourceSourceDefinition;
    production: ProductionDefinition;
    healing: HealingDefinition;
    spell: SpellDefinition;
    research: ResearchDefinition;
    translatable: ActorTranslateDefinition;
    flying: FlightDefinition;
    animatable: ActorAnimationsDefinition;
    aiControlled: PawnAiDefinition;
    containable: { enabled: boolean };
    selectable: SelectableDefinition;
    collider: ColliderDefinition;
    audio: AudioDefinition;
    buildingPrerequisites: BuildingPrerequisitesDefinition;
  }>;
  systems: Partial<{
    movement: {
      enabled: boolean;
    };
    action: {
      enabled: boolean;
    };
    spellCasting: {
      enabled: boolean;
    };
  }>;
  meta: Partial<{
    randomOfType: ObjectNames[];
    isMainBuilding: boolean;
  }>;
}>;
