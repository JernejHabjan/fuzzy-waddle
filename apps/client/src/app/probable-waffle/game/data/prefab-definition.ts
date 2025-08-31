import type { ObjectDescriptorDefinition } from "../entity/actor/components/object-descriptor-component";
import type { RepresentableDefinition } from "../entity/actor/components/representable-component";
import type { OwnerDefinition } from "../entity/actor/components/owner-component";
import type { VisionDefinition } from "../entity/actor/components/vision-component";
import type { InfoDefinition } from "../entity/actor/components/info-component";
import type { HealthDefinition } from "../entity/combat/components/health-component";
import type { AttackDefinition } from "../entity/combat/components/attack-component";
import type { ProductionCostDefinition } from "../entity/components/production/production-cost-component";
import type { RequirementsDefinition } from "../entity/actor/components/requirements-component";
import type { BuilderDefinition } from "../entity/actor/components/builder-component";
import type { ConstructionSiteDefinition } from "../entity/components/construction/construction-site-component";
import type { WalkableDefinition } from "../entity/actor/components/walkable-component";
import type { GathererDefinition } from "../entity/actor/components/gatherer-component";
import type { ContainerDefinition } from "../entity/building/container-component";
import type { ResourceDrainDefinition } from "../entity/economy/resource/resource-drain-component";
import type { ResourceSourceDefinition } from "../entity/economy/resource/resource-source-component";
import type { ProductionDefinition } from "../entity/components/production/production-component";
import type { HealingDefinition } from "../entity/combat/components/healing-component";
import type { ActorTranslateDefinition } from "../entity/actor/components/actor-translate-component";
import type { FlightDefinition } from "../entity/actor/components/flight-component";
import type { ActorAnimationsDefinition } from "../entity/actor/components/animation/animation-actor-component";
import type { PawnAiDefinition } from "../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import type { SelectableDefinition } from "../entity/actor/components/selectable-component";
import type { ColliderDefinition } from "../entity/actor/components/collider-component";
import type { AudioDefinition } from "../entity/actor/components/audio-actor-component";
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
