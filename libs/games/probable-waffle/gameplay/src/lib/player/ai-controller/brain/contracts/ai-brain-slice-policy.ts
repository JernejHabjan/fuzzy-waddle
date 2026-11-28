import type { AiBrainSliceName } from "../ai-brain-slice-policy";

/** Durable ownership policy for one current state slice. */
export interface AiBrainSlicePolicy {
  readonly slice: AiBrainSliceName;
  readonly reducerOwner: string;
  readonly defaultOwner: "createAiBrainState";
  readonly migration: "preserve_current_or_bootstrap_from_current_world";
  readonly serializer: "canonical_ai";
}
