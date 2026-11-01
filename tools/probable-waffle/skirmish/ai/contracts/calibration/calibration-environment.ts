import type { ChildProcess } from "node:child_process";
import type { installPinnedCalibrationAdapter } from "../../calibration/pinned-calibration-adapter.ts";

/** Owns only newly created detached sources and their servers for the optional calibration runner. */
export interface CalibrationEnvironment {
  root: string;
  candidate: string;
  baseline: string;
  directory: string;
  sources: Partial<Record<"candidate" | "baseline", string>>;
  servers: { lane: string; child: ChildProcess; url: string }[];
  createdWorktrees: string[];
  batch: number;
  adapter?: ReturnType<typeof installPinnedCalibrationAdapter>;
}
