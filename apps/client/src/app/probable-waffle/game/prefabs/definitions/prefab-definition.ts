import type { ObjectDescriptorDefinition } from "../../entity/components/object-descriptor-component";
import type { RepresentableDefinition } from "../../entity/components/representable-component";
import type { OwnerDefinition } from "../../entity/components/owner-component";
import type { VisionDefinition } from "../../entity/components/vision-component";
import type { InfoDefinition } from "../../entity/components/info-component";
import type { HealthDefinition } from "../../entity/components/combat/components/health-component";
import type { AttackDefinition } from "../../entity/components/combat/components/attack-component";
import type { ProductionCostDefinition } from "../../entity/components/production/production-cost-component";
import type { RequirementsDefinition } from "../../entity/components/requirements-component";
import type { BuilderDefinition } from "../../entity/components/builder-component";
import type { ConstructionSiteDefinition } from "../../entity/components/construction/construction-site-component";
import type { WalkableDefinition } from "../../entity/components/walkable-component";
import type { GathererDefinition } from "../../entity/components/gatherer-component";
import type { ContainerDefinition } from "../../entity/building/container-component";
import type { ResourceDrainDefinition } from "../../entity/components/resource/resource-drain-component";
import type { ResourceSourceDefinition } from "../../entity/components/resource/resource-source-component";
import type { ProductionDefinition } from "../../entity/components/production/production-component";
import type { HealingDefinition } from "../../entity/components/combat/components/healing-component";
import type { ActorTranslateDefinition } from "../../entity/components/actor-translate-component";
import type { FlightDefinition } from "../../entity/components/flight-component";
import type { ActorAnimationsDefinition } from "../../entity/components/animation/animation-actor-component";
import type { PawnAiDefinition } from "../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import type { SelectableDefinition } from "../../entity/components/selectable-component";
import type { ColliderDefinition } from "../../entity/components/collider-component";
import type { AudioDefinition } from "../../entity/components/audio-actor-component";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

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
    translatable: ActorTranslateDefinition;
    flying: FlightDefinition;
    animatable: ActorAnimationsDefinition;
    aiControlled: PawnAiDefinition;
    containable: { enabled: boolean };
    selectable: SelectableDefinition;
    collider: ColliderDefinition;
    audio: AudioDefinition;
  }>;
  systems: Partial<{
    movement: {
      enabled: boolean;
    };
    action: {
      enabled: boolean;
    };
  }>;
  meta: Partial<{
    randomOfType: ObjectNames[];
  }>;
}>;
