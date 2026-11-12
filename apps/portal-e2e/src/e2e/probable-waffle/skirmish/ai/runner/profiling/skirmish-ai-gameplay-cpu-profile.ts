import type { CDPSession, Page } from "@playwright/test";
import { writeFileSync } from "node:fs";

/** Opt-in browser sampling around real gameplay; raw traces stay outside version control. */
export class SkirmishGameplayCpuProfile {
  private constructor(private readonly session: CDPSession) {}

  static async start(page: Page): Promise<SkirmishGameplayCpuProfile> {
    const session = await page.context().newCDPSession(page);
    try {
      await session.send("Profiler.enable");
      await session.send("Profiler.setSamplingInterval", { interval: 1000 });
      await session.send("Profiler.start");
      return new SkirmishGameplayCpuProfile(session);
    } catch (error) {
      await session.detach().catch(() => undefined);
      throw error;
    }
  }

  async finish(path: string) {
    try {
      const { profile } = await this.session.send("Profiler.stop");
      if (
        !Array.isArray(profile.nodes) ||
        !Array.isArray(profile.samples) ||
        !Array.isArray(profile.timeDeltas) ||
        profile.samples.length !== profile.timeDeltas.length
      )
        throw new Error("gameplay_cpu_profile_incomplete");
      writeFileSync(path, JSON.stringify(profile));
      const frames = new Map<number, { functionName: string; url: string; lineNumber: number; columnNumber: number }>();
      for (const node of profile.nodes) frames.set(node.id, node.callFrame);
      const selfMicros = new Map<number, number>();
      for (let index = 0; index < profile.samples.length; index++) {
        const nodeId = profile.samples[index],
          micros = profile.timeDeltas[index];
        if (nodeId === undefined || micros === undefined || !Number.isFinite(micros))
          throw new Error("gameplay_cpu_sample_missing");
        selfMicros.set(nodeId, (selfMicros.get(nodeId) ?? 0) + micros);
      }
      const hotspots = [...selfMicros]
        .map(([nodeId, micros]) => ({
          nodeId,
          selfMs: micros / 1000,
          ...frames.get(nodeId)
        }))
        .sort((left, right) => right.selfMs - left.selfMs)
        .slice(0, 24);
      return { durationMs: (profile.endTime - profile.startTime) / 1000, samples: profile.samples.length, hotspots };
    } finally {
      await this.session.detach().catch(() => undefined);
    }
  }
}
