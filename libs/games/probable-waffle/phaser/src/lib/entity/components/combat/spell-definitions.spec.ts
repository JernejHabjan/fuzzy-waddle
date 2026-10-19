import { spellDefinitions } from "./spell-definitions";
import { SpellType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/spell-type";
import {
  SharedActorActionsSfxFireSpellSounds,
  SharedActorActionsSfxFrostFireSounds,
  SharedActorActionsSfxFrostImpactSounds,
  SharedActorActionsSfxHealSounds
} from "../../../sfx/shared-actor-actions-sfx";

describe("spellDefinitions feedback", () => {
  it("uses registered, semantically matching audio-sprite definitions for supported spell feedback", () => {
    expect(spellDefinitions[SpellType.Snowstorm].sounds).toEqual({
      cast: SharedActorActionsSfxFrostFireSounds[0],
      impact: SharedActorActionsSfxFrostImpactSounds[0]
    });
    expect(spellDefinitions[SpellType.Firestorm].sounds).toEqual({ cast: SharedActorActionsSfxFireSpellSounds[0] });
    expect(spellDefinitions[SpellType.FrostNova].sounds).toEqual({
      cast: SharedActorActionsSfxFrostFireSounds[0],
      impact: SharedActorActionsSfxFrostImpactSounds[0]
    });
    expect(spellDefinitions[SpellType.HealingLight].sounds).toEqual({
      cast: SharedActorActionsSfxHealSounds[0],
      impact: SharedActorActionsSfxHealSounds[0]
    });
    expect(spellDefinitions[SpellType.HealingRain].sounds).toEqual({ cast: SharedActorActionsSfxHealSounds[0] });
    expect(spellDefinitions[SpellType.HealingTotem].sounds).toEqual({ cast: SharedActorActionsSfxHealSounds[0] });
  });

  it("does not reference the former unregistered projectile impact animations", () => {
    for (const spellDefinition of Object.values(spellDefinitions)) {
      const impactAnimations = spellDefinition.projectile?.impactAnimation?.anims ?? [];
      expect(impactAnimations).not.toContain("snowstorm_impact");
      expect(impactAnimations).not.toContain("frost_nova_impact");
    }
  });
});
