export const SceneLightingDataKeys = {
  ignoreEffects: "sceneLightingIgnoreEffects",
  castsShadow: "sceneLightingCastsShadow"
} as const;

type DataEnabledGameObject = Phaser.GameObjects.GameObject & {
  getData?: (key: string) => unknown;
  setDataEnabled?: () => Phaser.GameObjects.GameObject;
  setData?: (key: string, value: unknown) => Phaser.GameObjects.GameObject;
};

export function markGameObjectIgnoreSceneLighting(gameObject: Phaser.GameObjects.GameObject): void {
  const target = gameObject as DataEnabledGameObject;
  target.setDataEnabled?.();
  target.setData?.(SceneLightingDataKeys.ignoreEffects, true);
  target.setData?.(SceneLightingDataKeys.castsShadow, false);
}

export function setGameObjectSceneShadowCasting(
  gameObject: Phaser.GameObjects.GameObject,
  castsShadow: boolean
): void {
  const target = gameObject as DataEnabledGameObject;
  target.setDataEnabled?.();
  target.setData?.(SceneLightingDataKeys.castsShadow, castsShadow);
}

export function shouldIgnoreSceneLighting(gameObject: Phaser.GameObjects.GameObject): boolean {
  const target = gameObject as DataEnabledGameObject;
  return target.getData?.(SceneLightingDataKeys.ignoreEffects) === true;
}

export function shouldCastSceneShadow(gameObject: Phaser.GameObjects.GameObject): boolean {
  const target = gameObject as DataEnabledGameObject;
  const value = target.getData?.(SceneLightingDataKeys.castsShadow);
  return value !== false;
}
