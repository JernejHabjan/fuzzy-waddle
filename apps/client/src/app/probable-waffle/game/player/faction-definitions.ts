import { TechTreeComponent } from "./tech-tree";
import { FactionInfo } from "./faction-info";
import { FactionType } from "@fuzzy-waddle/api-interfaces";

export class FactionDefinitions {
  static tivara: FactionInfo = new FactionInfo(
    FactionType.Tivara,
    "Tivara",
    new TechTreeComponent(),
    [
      "Sandhold", // Sandhold.name,
      "TivaraMacemanMale" // TivaraMacemanMale.name
    ],
    [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 }
    ],
    [],
    [], // todo
    true
  );
  static skaduwee: FactionInfo = new FactionInfo(
    FactionType.Skaduwee,
    "Skaduwee",
    new TechTreeComponent(),
    [
      "FrostForge", // FrostForge.name,
      "SkaduweeMagicianFemale" // SkaduweeMagicianFemale.name
    ],
    [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 }
    ],
    [],
    [], // todo
    true
  );

  static factions: { type: FactionType; value: FactionInfo }[] = [
    { type: FactionType.Tivara, value: FactionDefinitions.tivara },
    { type: FactionType.Skaduwee, value: FactionDefinitions.skaduwee }
  ];
}
