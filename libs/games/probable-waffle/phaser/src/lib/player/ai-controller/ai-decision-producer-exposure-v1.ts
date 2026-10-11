/** Test-only target-specific shared attack choice at an exact current consumed observation. */
export interface AiDecisionProducerExposureV1 {
  readonly tick: number;
  readonly generation: number;
  readonly pairs: readonly {
    readonly producerActorId: string;
    readonly threatActorId: string;
    /** Missing current fair/live binding is unavailable, never a safe verdict. */
    readonly status: "known" | "no_attack" | "unavailable";
    /** Index into the consumed threat's weapon array, selected by the actual AttackComponent.getAttack. */
    readonly attackIndex: number | null;
    readonly range: number | null;
    /** Native positioning range can choose a different equal-damage weapon; not an attack-success verdict. */
    readonly positioningRange: number | null;
    readonly highGroundBonus: number | null;
    /** Actual representable elevations including flight; distinct from the observation's logical base z. */
    readonly attackerElevation: number | null;
    readonly targetElevation: number | null;
    /** Shared floored 3D tile distance, including flight-height separation. */
    readonly distanceTiles: number | null;
    /** Geometric damage/minimum/effective-range band only; ignores orders, path, cooldown and stun. */
    readonly withinSelectedWeaponBand: boolean | null;
  }[];
  readonly gaps: readonly string[];
}
