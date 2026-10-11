import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

/** Callback-time identity/state of a real object, including the actual index lookup and canonical definition family. */
export interface AiRuntimeCreatedActorV1 {
  readonly actorId: string | null;
  readonly objectName: string;
  readonly canonicalObjectName: ObjectNames;
  readonly playerNumber: number | null;
  readonly active: boolean;
  readonly alive: boolean;
  readonly finished: boolean;
  /** The same returned object is indexed in its own scene, not merely another actor sharing an ID. */
  readonly indexed: boolean;
}
