export const SceneLightingDataKeys = {
  ignoreEffects: "sceneLightingIgnoreEffects",
  castsShadow: "sceneLightingCastsShadow",
  ambientResponsive: "sceneLightingAmbientResponsive"
} as const;

type DataEnabledGameObject = Phaser.GameObjects.GameObject & {
  getData?: (key: string) => unknown;
  setDataEnabled?: () => Phaser.GameObjects.GameObject;
  setData?: (key: string, value: unknown) => Phaser.GameObjects.GameObject;
};

/**
 * Marks a game object as fully invisible to the scene lighting system.
 * Use this for synthetic helper visuals created by the lighting service itself.
 */
export function markGameObjectIgnoreSceneLighting(gameObject: Phaser.GameObjects.GameObject): void {
  const target = gameObject as DataEnabledGameObject;
  target.setDataEnabled?.();
  target.setData?.(SceneLightingDataKeys.ignoreEffects, true);
  target.setData?.(SceneLightingDataKeys.castsShadow, false);
  target.setData?.(SceneLightingDataKeys.ambientResponsive, false);
}

/**
 * Marks a game object as ambient-only.
 * It will not cast drop shadows, but the lighting service may dim it during night-time.
 */
export function markGameObjectAmbientResponsive(gameObject: Phaser.GameObjects.GameObject): void {
  const target = gameObject as DataEnabledGameObject;
  target.setDataEnabled?.();
  target.setData?.(SceneLightingDataKeys.ignoreEffects, false);
  target.setData?.(SceneLightingDataKeys.castsShadow, false);
  target.setData?.(SceneLightingDataKeys.ambientResponsive, true);
}

export function setGameObjectSceneShadowCasting(
  gameObject: Phaser.GameObjects.GameObject,
  castsShadow: boolean
): void {
  const target = gameObject as DataEnabledGameObject;
  target.setDataEnabled?.();
  target.setData?.(SceneLightingDataKeys.castsShadow, castsShadow);
}

/**
 * Returns true when a game object should be skipped entirely by scene lighting.
 */
export function shouldIgnoreSceneLighting(gameObject: Phaser.GameObjects.GameObject): boolean {
  const target = gameObject as DataEnabledGameObject;
  return target.getData?.(SceneLightingDataKeys.ignoreEffects) === true;
}

/**
 * Returns true when a game object may participate in dropped-shadow rendering.
 */
export function shouldCastSceneShadow(gameObject: Phaser.GameObjects.GameObject): boolean {
  const target = gameObject as DataEnabledGameObject;
  const value = target.getData?.(SceneLightingDataKeys.castsShadow);
  return value !== false;
}

/**
 * Returns true when a game object should respond to ambient brightness changes only.
 */
export function shouldRespondToSceneAmbient(gameObject: Phaser.GameObjects.GameObject): boolean {
  const target = gameObject as DataEnabledGameObject;
  return target.getData?.(SceneLightingDataKeys.ambientResponsive) === true;
}
