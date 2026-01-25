import { FactionInfo } from "./faction-info";
import { FactionType, ObjectNames } from "@fuzzy-waddle/api-interfaces";

export class FactionDefinitions {
  static tivara: FactionInfo = new FactionInfo(FactionType.Tivara, "Tivara", [
    {
      actorName: ObjectNames.Sandhold
    },
    {
      actorName: ObjectNames.TivaraMacemanMale
    }
  ]);
  static skaduwee: FactionInfo = new FactionInfo(FactionType.Skaduwee, "Skaduwee", [
    {
      actorName: ObjectNames.FrostForge
    },
    {
      actorName: ObjectNames.SkaduweeMagicianFemale
    }
  ]);

  static factions: { type: FactionType; value: FactionInfo }[] = [
    { type: FactionType.Tivara, value: FactionDefinitions.tivara },
    { type: FactionType.Skaduwee, value: FactionDefinitions.skaduwee }
  ];
}
