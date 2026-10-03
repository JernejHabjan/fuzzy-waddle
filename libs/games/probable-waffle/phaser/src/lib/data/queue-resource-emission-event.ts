import type { QueueResourceEmissionScope } from "./queue-resource-emission-scope";
import type { QueueResourceEmissionRecord } from "./queue-resource-emission-record";

export const QUEUE_RESOURCE_EMISSION_EVENT = "queue-resource-emission";

/** Local diagnostic callbacks; live handles must be projected before retention. No admission/payment authority. */
export type QueueResourceEmissionEvent = QueueResourceEmissionRecord & {
  readonly scope: QueueResourceEmissionScope;
};
