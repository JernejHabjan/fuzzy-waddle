import { PureAiBrain } from "../ai-brain";
import type { AiBrainBoundaryHooks } from "../ai-brain-boundary-hooks";
import type { AiProfileConfig } from "../../contracts/ai-profile-config";
import type { AiCapabilityCatalog } from "../../contracts/observation/ai-capability-catalog";
import { AiMacroManager } from "../../planning/production/macro/ai-macro-manager";
import { AiResourceServiceManager } from "../../planning/economy/service/ai-resource-service-manager";
import { AiTransportManager } from "../../planning/transport/coordination/ai-transport-manager";
import { AiSkirmishManager } from "../../planning/strategy/missions/ai-skirmish-manager";
import { AiBaseManager } from "../../planning/expansion/ai-base-manager";
import { AiFortificationManager } from "../../planning/fortification/ai-fortification-manager";
import { AiRecoveryManager } from "../../planning/recovery/ai-recovery-manager";
import { AiTacticsManager } from "../../planning/tactics/orders/ai-tactics-manager";
import { AiAdaptationManager } from "../../planning/adaptation/ai-adaptation-manager";

/** Shared production owner/order for live decisions and isolated replay; no scene or dispatch capability is installed here. */
export function createAiProductionBrain(
  profile: AiProfileConfig, catalog: () => AiCapabilityCatalog | undefined, hooks?: AiBrainBoundaryHooks
): PureAiBrain {
  return new PureAiBrain(profile, [new AiMacroManager(catalog), new AiResourceServiceManager(catalog),
    new AiTransportManager(catalog), new AiSkirmishManager(profile, catalog), new AiBaseManager(profile, catalog),
    new AiFortificationManager(profile, catalog), new AiRecoveryManager(catalog), new AiTacticsManager(profile, catalog),
    new AiAdaptationManager(profile, catalog)], hooks);
}
