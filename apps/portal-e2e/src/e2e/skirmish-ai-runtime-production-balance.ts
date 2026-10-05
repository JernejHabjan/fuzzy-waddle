import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Full shared balances require every resource and reject unknown fields; sparse stored prices are separate. */
export function isRuntimeProductionBalance(value: Readonly<Partial<Record<ResourceType, number>>> | null | undefined) {
  return !!value && Object.keys(value).length === Object.values(ResourceType).length &&
    Object.values(ResourceType).every((type) => typeof value[type] === "number" &&
      Number.isFinite(value[type]) && (value[type] ?? -1) >= 0);
}

