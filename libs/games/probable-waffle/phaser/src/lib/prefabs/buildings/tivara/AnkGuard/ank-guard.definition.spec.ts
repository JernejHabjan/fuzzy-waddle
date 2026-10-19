import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import { ankGuardDefinition } from "./ank-guard.definition";
import { tivaraSlingshotFemaleDefinition } from
  "../../../characters/tivara/tivara-slingshot-female/tivara-slingshot-female.definition";

describe("Tivara spell research reachability", () => {
  it("provides a faction producer for every research-gated slingshot spell", () => {
    const spells = tivaraSlingshotFemaleDefinition.components.spell.availableSpells;
    for (const spell of spells) {
      const research = Object.values(researchDefinitions).find((definition) => definition.unlocksSpell === spell);
      expect(research).toBeDefined();
      expect(research?.requiredBuilding).toBe(ObjectNames.AnkGuard);
      expect(ankGuardDefinition.components.research.availableResearch).toContain(research?.type);
    }
  });
});
