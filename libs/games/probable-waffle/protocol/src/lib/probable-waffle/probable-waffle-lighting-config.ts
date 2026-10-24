import type { ProbableWaffleLightingAmbientKeyframe } from "./probable-waffle-lighting-ambient-keyframe";

/**
 * Defines the structural probable waffle lighting config contract. Its declared surface makes enabled, ambient
 * color, self shadow, drop shadow, day night cycle explicit to every consumer. This named alias keeps the
 * boundary explicit without duplicating an anonymous object shape.
 */
export type ProbableWaffleLightingConfig = {
  /**
   * Master per-map switch for the lighting system.
   * When `false`, the scene skips dynamic lighting, ambient cycling, and related light setup.
   */
  enabled?: boolean;
  /**
   * Base ambient fallback color when day/night cycle is disabled.
   */
  ambientColor?: number;
  /**
   * Optional keyed/nested self shadow structure owned by {@link ProbableWaffleLightingConfig}. Keep its keys and
   * value contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  selfShadow?: {
    /**
     * Enables Phaser 4 self-shadowing on compatible lit objects.
     * This affects how normal-mapped or self-shadow-capable renderables shade themselves.
     */
    enabled?: boolean | null;
    /**
     * Controls how soft the lit-to-shadow transition appears on self-shadowed surfaces.
     */
    penumbra?: number;
    /**
     * Threshold for flattening very subtle normal variation so self-shadowing does not overreact
     * on nearly-flat surfaces.
     */
    diffuseFlatThreshold?: number;
  };
  /**
   * Optional keyed/nested drop shadow structure owned by {@link ProbableWaffleLightingConfig}. Keep its keys and
   * value contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  dropShadow?: {
    /**
     * Enables dropped terrain-shadow behavior for this map when the runtime shadow path is active.
     */
    enabled?: boolean;
    /**
     * Base shadow tint color used for dropped terrain shadows.
     */
    color?: number;
    /**
     * Shadow opacity during strongest daylight.
     */
    opacityDay?: number;
    /**
     * Shadow opacity during night-time or moonlit portions of the cycle.
     */
    opacityNight?: number;
    /**
     * Horizontal shadow stretch relative to the caster bounds.
     */
    widthScale?: number;
    /**
     * Vertical shadow thickness relative to the caster bounds.
     */
    heightScale?: number;
    /**
     * Minimum caster-to-shadow offset when the sun is high and shadows are shorter.
     */
    minOffset?: number;
    /**
     * Maximum caster-to-shadow offset when the sun is low and shadows are longer.
     */
    maxOffset?: number;
  };
  /**
   * Optional collection value on {@link ProbableWaffleLightingConfig}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  dayNightCycle?: {
    /**
     * Enables animated ambient progression across the configured keyframes.
     */
    enabled?: boolean;
    /**
     * Full in-game day/night cycle duration in milliseconds before time scaling is applied.
     */
    durationMs?: number;
    /**
     * Initial normalized time when the scene starts.
     * `0` is midnight, `0.5` is midday, and `1` wraps back to midnight.
     */
    startTimeNormalized?: number;
    /**
     * Ordered ambient-color checkpoints used to interpolate the scene tint through the day.
     */
    keyframes?: ProbableWaffleLightingAmbientKeyframe[];
  };
  /**
   * Optional keyed/nested key light structure owned by {@link ProbableWaffleLightingConfig}. Keep its keys and
   * value contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  keyLight?: {
    /**
     * Enables the main moving directional-style scene light used to represent the sun or moon.
     */
    enabled?: boolean;
    /**
     * Base color of the moving key light.
     */
    color?: number;
    /**
     * Peak light intensity before runtime day-phase scaling is applied.
     */
    intensity?: number;
    /**
     * Base light radius used by the moving key light.
     */
    radius?: number;
    /**
     * Z height of the key light in Phaser's light pipeline.
     */
    z?: number;
  };
};
