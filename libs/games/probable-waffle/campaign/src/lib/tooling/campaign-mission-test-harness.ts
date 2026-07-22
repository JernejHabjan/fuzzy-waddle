import type {
  CampaignId,
  CampaignMissionRuntimeEvent,
  CampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import {
  CampaignMissionRuntime,
  serializeCampaignMissionRuntimeState,
  type CampaignMissionRuntimeOptions
} from "../runtime/campaign-mission-runtime";

/** Rendering-free deterministic harness used by mission smoke tests and authored checkpoint fixtures. */
export class CampaignMissionTestHarness {
  private tick = 0;
  private runtime: CampaignMissionRuntime;

  constructor(
    private readonly campaignId: CampaignId,
    private readonly content: CampaignMissionContent,
    restored?: CampaignMissionRuntimeState,
    private readonly options: CampaignMissionRuntimeOptions = {}
  ) {
    this.runtime = new CampaignMissionRuntime(campaignId, content, restored, options);
  }

  start(): CampaignMissionRuntimeState {
    return this.runtime.start(this.tick).state;
  }

  emit(event: Omit<CampaignMissionRuntimeEvent, "tick" | "sequence">): CampaignMissionRuntimeState {
    this.runtime.enqueueEvent({ ...event, tick: this.tick });
    return this.advance(1);
  }

  advance(ticks: number): CampaignMissionRuntimeState {
    for (let index = 0; index < ticks; index += 1) {
      this.tick += 1;
      this.runtime.advanceTo(this.tick);
    }
    return this.runtime.snapshot();
  }

  roundTrip(): CampaignMissionRuntimeState {
    const snapshot = this.runtime.snapshot();
    this.runtime = new CampaignMissionRuntime(this.campaignId, this.content, snapshot, this.options);
    return this.runtime.snapshot();
  }

  serialized(): string {
    return serializeCampaignMissionRuntimeState(this.runtime.snapshot());
  }

  snapshot(): CampaignMissionRuntimeState {
    return this.runtime.snapshot();
  }
}
