import { generalWorkerDefinitions } from "../../shared/worker/worker-shared.definition";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const skaduweeWorkerDefinition: PrefabDefinition = {
  ...generalWorkerDefinitions,
  components: {
    ...generalWorkerDefinitions.components,
    info: {
      name: "Umbral Worker",
      description: "Shaping the realm of shadows with silent devotion",
      smallImage: {
        key: "factions",
        frame: "character_icons/skaduwee/worker.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    representable: {
      width: 64,
      height: 64
    },
    objectDescriptor: {
      color: 0xf2f7fa
    },
    owner: {
      color: [
        {
          originalColor: 0x7995bf,
          epsilon: 0.15
        }
      ]
    },
    requirements: {
      actors: [ObjectNames.FrostForge]
    },
    builder: {
      constructionSiteOffset: 2,
      enterConstructionSite: false,
      constructableBuildings: [
        ObjectNames.FrostForge,
        ObjectNames.InfantryInn,
        ObjectNames.Owlery,
        ObjectNames.WorkMill,
        ObjectNames.WatchTower,
        ObjectNames.Wall,
        ObjectNames.Stairs
      ]
    }
  },
  meta: {
    randomOfType: [ObjectNames.SkaduweeWorkerFemale, ObjectNames.SkaduweeWorkerMale]
  }
} satisfies PrefabDefinition;
