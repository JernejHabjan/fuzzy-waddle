import { isDeepStrictEqual } from "node:util";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { RuntimeResourceCreditV1 } from "./skirmish-ai-runtime-resource-credit";
import type { normalizeRuntimeRecipientMutations } from "./skirmish-ai-runtime-recipient-mutations";

/** Exact recipient/payload/native terminal join; never use nearest operation, source owner or publication clock. */
export function runtimeResourceCreditMatchesOperation(credit: RuntimeResourceCreditV1,
  operation: ReturnType<typeof normalizeRuntimeRecipientMutations>["operations"][number]): boolean {
  const value = credit.fact.spatial, terminal = operation.terminal, mutation = terminal.mutation;
  if (value.kind !== "resource_service" || value.phase !== "resource_credit" || value.resourceType === null) return false;
  const type = value.resourceType;
  return value.operationId === mutation.operationId && terminal.playerNumber === value.beneficiary &&
    credit.beneficiary === value.beneficiary && mutation.action === "add" && mutation.phase === "returned" &&
    terminal.sequence < credit.fact.sequence &&
    terminal.tick <= credit.fact.tick && isDeepStrictEqual(mutation.before, value.before) &&
    isDeepStrictEqual(mutation.after, value.after) && isDeepStrictEqual(mutation.requested, value.callbackAmounts) &&
    credit.appliedAmount !== null && credit.appliedAmount === mutation.requested?.[type] &&
    Object.values(ResourceType).every((resource) => resource === type || (mutation.requested?.[resource] ?? 0) === 0);
}
