import type { AiRuntimeProductionFrontierV1 } from "./ai-runtime-production-frontier-v1";

/** Capture-owned bounded interval history. Identical consecutive physical states share one interval; money stays separate. */
export class AiRuntimeProductionFrontiers {
  private readonly intervals: AiRuntimeProductionFrontierV1[] = [];
  private readonly gaps = new Set<string>();
  private readonly required = new Set<number>();
  private lastClosed = -1;
  private latestTick: number | null = null;
  private fingerprint = "";

  /** Must be armed at paused tick zero, before the first frontier. A later poll cannot reconstruct lost history. */
  arm(latestTick: number, currentTick: number): void {
    if (
      !Number.isSafeInteger(latestTick) ||
      latestTick <= 0 ||
      (this.latestTick === null && currentTick !== 0) ||
      (this.latestTick !== null && this.latestTick !== latestTick)
    ) {
      this.gaps.add("production_frontier_horizon_invalid");
      return;
    }
    this.latestTick = latestTick;
    this.required.add(latestTick);
  }

  /** Deadlines are registered on selection, before dispatch. Already closed deadlines remain unavailable. */
  require(ticks: readonly number[]): void {
    if (this.latestTick === null) return;
    for (const tick of ticks) {
      if (this.required.has(tick)) continue;
      if (!Number.isSafeInteger(tick) || tick < 0 || tick <= this.lastClosed || tick > this.latestTick) {
        this.lose("production_frontier_deadline_unavailable");
      } else this.required.add(tick);
    }
  }

  get active(): boolean {
    return this.latestTick !== null && this.lastClosed < this.latestTick && this.gaps.size === 0;
  }

  /** The supplied detached state belongs to t, although the native clock has already incremented to t+1. */
  close(
    capturedAtTick: number,
    sample: () => Omit<AiRuntimeProductionFrontierV1, "capturedAtTick" | "closedFromTick" | "closedThroughTick">
  ): void {
    if (!this.active) return;
    const tick = capturedAtTick - 1;
    if (tick !== this.lastClosed + 1) {
      this.lose("production_frontier_clock_gap");
      return;
    }
    const state = sample();
    const key = JSON.stringify({
      actors: state.actors,
      queues: state.queues,
      completedResearch: state.completedResearch,
      exposure: state.exposure
    });
    const previous = this.intervals.at(-1);
    if (previous && key === this.fingerprint && !this.required.has(tick) && !this.required.has(this.lastClosed)) {
      this.intervals[this.intervals.length - 1] = {
        ...previous,
        capturedAtTick,
        closedThroughTick: tick,
        afterSequence: state.afterSequence
      };
    } else {
      if (this.intervals.length >= 8192) {
        this.lose("production_frontier_overflow");
        return;
      }
      this.intervals.push(structuredClone({ ...state, capturedAtTick, closedFromTick: tick, closedThroughTick: tick }));
    }
    this.fingerprint = key;
    this.lastClosed = tick;
  }

  lose = (reason: string): void => {
    if (this.latestTick !== null) this.gaps.add(reason);
  };

  read() {
    return structuredClone({
      latestTick: this.latestTick,
      closedThroughTick: this.lastClosed,
      requiredTicks: [...this.required].sort((a, b) => a - b),
      intervals: this.intervals,
      gaps: [
        ...this.gaps,
        ...(this.latestTick !== null && this.lastClosed < this.latestTick ? ["production_frontier_not_closed"] : [])
      ].sort()
    });
  }
}
