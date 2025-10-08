// Provides enter/exit threshold behavior for a numeric signal (e.g., power ratio, surplus index).
export interface HysteresisConfig {
  enter: number;
  exit: number;
}
export interface HysteresisState {
  entered: boolean;
  changed: boolean;
  value: number;
}
export type HysteresisEvaluator = (value: number) => HysteresisState;

export function makeHysteresisTracker(cfg: HysteresisConfig): HysteresisEvaluator {
  if (cfg.exit > cfg.enter) {
    // Ensure exit < enter to create a proper hysteresis band; swap if misconfigured.
    const tmp = cfg.exit;
    cfg.exit = cfg.enter;
    cfg.enter = tmp;
  }
  let entered = false;
  return (value: number): HysteresisState => {
    let changed = false;
    if (!entered && value >= cfg.enter) {
      entered = true;
      changed = true;
    } else if (entered && value <= cfg.exit) {
      entered = false;
      changed = true;
    }
    return { entered, changed, value };
  };
}
