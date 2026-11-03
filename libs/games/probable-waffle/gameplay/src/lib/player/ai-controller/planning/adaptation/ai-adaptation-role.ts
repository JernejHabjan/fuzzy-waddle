import type { AiBrainState } from "../../contracts/state/ai-state-contracts";

export type AiAdaptationRole = AiBrainState["economyProduction"]["adaptation"]["activeRoleTargets"][number]["role"];
