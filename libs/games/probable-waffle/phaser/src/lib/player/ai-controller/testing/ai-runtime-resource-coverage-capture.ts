import type { AiRuntimeResourceCoverageV1 } from "./ai-runtime-resource-coverage-v1";

/** Capture-owned partial coverage; every loss fences before any fallible record write. Never a gameplay clock or registry. */
export class AiRuntimeResourceCoverageCapture {
  private lost = false;
  private lossEpoch = 0;
  private lastTick: number;
  private readonly losses = new Set<string>();
  private readonly cohorts: AiRuntimeResourceCoverageV1["cohorts"][number][] = [];
  private readonly components = new WeakMap<object, number>();

  constructor(private readonly startedTick: number,
    private readonly boundary: () => AiRuntimeResourceCoverageV1["frontier"]) { this.lastTick = startedTick; }

  /** Global conservative fence, including failure before owner/actor identity can be read. It cannot be repaired later. */
  readonly lose = (reason: string): void => {
    this.lost = true;
    this.lossEpoch = Math.min(8192, this.lossEpoch + 1);
    if (this.losses.size < 32) this.losses.add(reason);
  };

  /** Called by the existing inventory/subscription route after successful listener installation. No extra actor scan. */
  install(component: object, actorId: string, playerNumber: number): void {
    const existing = this.components.get(component);
    if (existing !== undefined) {
      const cohort = this.cohorts[existing - 1];
      if (cohort.actorId !== actorId || cohort.playerNumber !== playerNumber) this.lose("cohort_owner_or_actor_changed");
      return;
    }
    if (this.cohorts.length >= 256) { this.lose("cohort_overflow"); return; }
    if (this.cohorts.some((cohort) => cohort.actorId === actorId && cohort.playerNumber === playerNumber)) {
      this.lose("component_or_actor_identity_replaced");
    }
    const installed = this.boundary();
    const cohortId = this.cohorts.length + 1;
    this.components.set(component, cohortId);
    this.cohorts.push({ cohortId, actorId, playerNumber, installed, channels: ["cargo", "credit"] });
  }

  /** Tick emission is a start boundary, not an asynchronous tick seal. Missing intermediate ticks fence coverage. */
  tick(tick: number): void {
    if (!Number.isSafeInteger(tick) || tick < this.lastTick || tick > this.lastTick + 1) this.lose("tick_discontinuity");
    this.lastTick = tick;
  }

  /** Actual detached read position; unsupported mutation and global beneficiary authority remain explicit. */
  read(): AiRuntimeResourceCoverageV1 {
    const frontier = this.boundary();
    return structuredClone({ captureEpoch: 1, lossEpoch: this.lossEpoch, startedTick: this.startedTick,
      frontier, lost: this.lost, losses: [...this.losses], cohorts: this.cohorts,
      channels: { recipientNativeMutations: "partial", selectedNeedLifecycle: "partial",
        reconciledLiabilities: "partial", cargoLifetime: "partial" },
      gaps: ["resource_component_mutation_history_incomplete", "resource_service_lifetime_history_incomplete",
        "resource_beneficiary_need_history_missing", "resource_continuous_capacity_predicates_missing",
        "resource_recipient_mutable_alias_history_incomplete"] }
      satisfies AiRuntimeResourceCoverageV1);
  }
}
