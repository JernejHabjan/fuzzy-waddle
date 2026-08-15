import { spellDefinitions } from "./spell-definitions";

describe("spellDefinitions feedback", () => {
  it("leaves audio feedback unset until registered spell assets exist", () => {
    for (const spellDefinition of Object.values(spellDefinitions)) {
      expect(spellDefinition.sounds).toBeUndefined();
    }
  });

  it("does not reference the former unregistered projectile impact animations", () => {
    for (const spellDefinition of Object.values(spellDefinitions)) {
      const impactAnimations = spellDefinition.projectile?.impactAnimation?.anims ?? [];
      expect(impactAnimations).not.toContain("snowstorm_impact");
      expect(impactAnimations).not.toContain("frost_nova_impact");
    }
  });
});
