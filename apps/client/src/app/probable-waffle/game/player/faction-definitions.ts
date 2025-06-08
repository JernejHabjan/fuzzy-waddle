import { TechTreeComponent } from "./tech-tree";
import { FactionInfo } from "./faction-info";
import { FactionType } from "@fuzzy-waddle/api-interfaces";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export class FactionDefinitions {
  static tivara: FactionInfo = new FactionInfo(
    FactionType.Tivara,
    "Tivara",
    new TechTreeComponent(),
    [ObjectNames.Sandhold, ObjectNames.TivaraMacemanMale],
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
    [ObjectNames.FrostForge, ObjectNames.SkaduweeMagicianFemale],
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
