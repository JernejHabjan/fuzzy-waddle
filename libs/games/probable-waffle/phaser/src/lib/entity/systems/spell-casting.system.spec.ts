import type Phaser from "phaser";
import type { SoundDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/actor-audio/sound-definition";
import type { SpellData } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/spell-data";
import { SpellCastingSystem } from "./spell-casting.system";
import { EffectsAnims } from "../../animations/effects";

type ImpactAudioHarness = {
  playImpactSound(impactSound: SoundDefinition | undefined, targetTilePosition: { x: number; y: number }): void;
  playImpactEffect(
    spellData: SpellData,
    targetTilePosition: { x: number; y: number },
    targetWorldPosition: { x: number; y: number }
  ): void;
};

describe("SpellCastingSystem impact audio", () => {
  const impactSound = { key: "spell-effects", spriteName: "frost-impact" } satisfies SoundDefinition;
  const targetTilePosition = { x: 4, y: 7 };

  function createHarness(tileVisibility: "visible" | "explored" | "unexplored") {
    const projectileSprite = {} as Phaser.GameObjects.Image;
    const playSpatialAudioSprite = jest.fn();
    const getTileVisibility = jest.fn().mockReturnValue(tileVisibility);
    const system = Object.assign(Object.create(SpellCastingSystem.prototype), {
      audioService: { playSpatialAudioSprite },
      fogOfWarComponent: { getTileVisibility },
      projectileSprite
    }) as ImpactAudioHarness;

    return { system, projectileSprite, playSpatialAudioSprite, getTileVisibility };
  }

  it("plays configured impact audio spatially from the resolved projectile position", () => {
    const { system, projectileSprite, playSpatialAudioSprite, getTileVisibility } = createHarness("visible");

    system.playImpactSound(impactSound, targetTilePosition);

    expect(getTileVisibility).toHaveBeenCalledWith(4, 7);
    expect(playSpatialAudioSprite).toHaveBeenCalledWith(projectileSprite, "spell-effects", "frost-impact");
  });

  it.each(["explored", "unexplored"] as const)("suppresses impact audio on a %s tile", (tileVisibility) => {
    const { system, playSpatialAudioSprite } = createHarness(tileVisibility);

    system.playImpactSound(impactSound, targetTilePosition);

    expect(playSpatialAudioSprite).not.toHaveBeenCalled();
  });

  it("remains silent when no impact sound is configured", () => {
    const { system, playSpatialAudioSprite } = createHarness("visible");

    system.playImpactSound(undefined, targetTilePosition);

    expect(playSpatialAudioSprite).not.toHaveBeenCalled();
  });

  it("creates and layers configured impact VFX at the resolved visible position", () => {
    const impactSprite = { setDepth: jest.fn(), setTint: jest.fn() } as unknown as Phaser.GameObjects.Sprite;
    const createImpactEffect = jest.spyOn(EffectsAnims, "createAndPlayEffectAnimation").mockReturnValue(impactSprite);
    const { system } = createHarness("visible");
    const gameObject = { scene: {} } as Phaser.GameObjects.GameObject;
    Object.assign(system as object, { gameObject, projectileSprite: { depth: 12 } });
    const spellData = {
      projectile: { impactAnimation: { anims: [EffectsAnims.ANIM_IMPACT_1], tint: 0x99ccff } }
    } as SpellData;

    system.playImpactEffect(spellData, targetTilePosition, { x: 128, y: 256 });

    expect(createImpactEffect).toHaveBeenCalledWith(gameObject.scene, EffectsAnims.ANIM_IMPACT_1, 128, 256);
    expect(impactSprite.setDepth).toHaveBeenCalledWith(13);
    expect(impactSprite.setTint).toHaveBeenCalledWith(0x99ccff);
  });
});
