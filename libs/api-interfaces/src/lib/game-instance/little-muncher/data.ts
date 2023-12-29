export class LittleMuncherPosition {
  x = 0;
}

export class LittleMuncherBoost {
  constructor(
    public boostMultiplier: number = 1,
    public durationInSec: number = 0
  ) {}
}
