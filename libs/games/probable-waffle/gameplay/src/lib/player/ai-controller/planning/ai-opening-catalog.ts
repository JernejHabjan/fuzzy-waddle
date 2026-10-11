import { FactionType, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

/** One resolved opening checkpoint; the runtime catalog remains the authority for legality. */
export interface OpeningCheckpoint {
  readonly id: string;
  readonly purpose: string;
  readonly requiredObject: ObjectNames;
  readonly desired: number;
}

export const factionOpenings: Readonly<Record<FactionType, readonly OpeningCheckpoint[]>> = {
  [FactionType.Tivara]: [
    { id: "bootstrap-worker", purpose: "bootstrap_worker", requiredObject: ObjectNames.TivaraWorker, desired: 1 },
    { id: "supply-safety", purpose: "supply_buffer", requiredObject: ObjectNames.Olival, desired: 1 },
    { id: "first-producer", purpose: "first_military_producer", requiredObject: ObjectNames.AnkGuard, desired: 1 },
    { id: "sustainable-food", purpose: "sustainable_food", requiredObject: ObjectNames.Granary, desired: 1 }
  ],
  [FactionType.Skaduwee]: [
    { id: "bootstrap-worker", purpose: "bootstrap_worker", requiredObject: ObjectNames.SkaduweeWorker, desired: 1 },
    { id: "supply-safety", purpose: "supply_buffer", requiredObject: ObjectNames.Emberstone, desired: 1 },
    { id: "first-producer", purpose: "first_military_producer", requiredObject: ObjectNames.InfantryInn, desired: 1 },
    { id: "sustainable-food", purpose: "sustainable_food", requiredObject: ObjectNames.Granary, desired: 1 }
  ]
};

/** Archetypes vary a legal branch budget only; every profile still executes the shared essential checkpoints. */
export function openingBudget(archetypeId: string): {
  readonly firstForce: number;
  readonly supplyBuffer: number;
  readonly rangedPermille: number;
} {
  const parts = archetypeId.split(":");
  const purpose = parts[parts.length - 1];
  switch (purpose) {
    case "rush":
    case "pressure":
      return { firstForce: 4, supplyBuffer: 3, rangedPermille: 300 };
    case "macro":
      return { firstForce: 4, supplyBuffer: 5, rangedPermille: 400 };
    case "tech":
      return { firstForce: 5, supplyBuffer: 4, rangedPermille: 500 };
    case "turtle":
    case "safe":
      return { firstForce: 6, supplyBuffer: 4, rangedPermille: 500 };
    default:
      return { firstForce: 6, supplyBuffer: 3, rangedPermille: 400 };
  }
}
