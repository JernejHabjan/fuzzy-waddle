import type { RuntimeResourceServiceInterval } from "./skirmish-ai-runtime-resource-service-interval";

/** Distinct native-position diagnostics. Publication may follow the endpoint; both native phases must fit its frontiers. */
export interface RuntimeResourceApplicationInterval {
  readonly declaration: RuntimeResourceServiceInterval["declaration"];
  readonly positionBasis: "native_operation_entry";
  readonly observedIncome: number | null;
  readonly observedContributionUpperBound: number | null;
  readonly usefulContribution: null;
  readonly retainedUsefulThroughput: null;
  readonly continuousUsefulCapacity: null;
  readonly windows: readonly {
    readonly startTick: number;
    readonly endTick: number;
    /** Unique exact operations wholly within (start frontier, end frontier]; never publication positions. */
    readonly operationIds: readonly number[];
    readonly observedIncome: number | null;
    readonly observedContributionUpperBound: number | null;
    readonly usefulContribution: null;
    readonly meetsUsefulFloor: null;
    readonly gaps: readonly string[];
  }[];
  readonly gaps: readonly string[];
}
