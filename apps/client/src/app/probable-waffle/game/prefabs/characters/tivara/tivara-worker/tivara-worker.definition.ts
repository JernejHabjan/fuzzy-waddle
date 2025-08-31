import { generalWorkerDefinitions } from "../../shared/worker/worker-shared.definition";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const tivaraWorkerDefinition: PrefabDefinition = {
  ...generalWorkerDefinitions,
  components: {
    ...generalWorkerDefinitions.components,
    info: {
      name: "Tivara Scavenger",
      description: "Guardian of forgotten secrets, laboring in shadow to uphold the ancient cycle",
      smallImage: {
        key: "factions",
        frame: "character_icons/tivara/worker.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    representable: {
      width: 64,
      height: 64
    },
    objectDescriptor: {
      color: 0xc2a080
    },
    owner: {
      color: [
        {
          originalColor: 0x31770f,
          epsilon: 0.25
        }
      ]
    },
    requirements: {
      actors: [ObjectNames.Sandhold]
    },
    builder: {
      constructionSiteOffset: 2,
      enterConstructionSite: false,
      constructableBuildings: [
        ObjectNames.Sandhold,
        ObjectNames.AnkGuard,
        ObjectNames.Olival,
        ObjectNames.Temple,
        ObjectNames.WorkMill,
        ObjectNames.WatchTower,
        ObjectNames.Wall,
        ObjectNames.Stairs
      ]
    }
  },
  meta: {
    randomOfType: [ObjectNames.TivaraWorkerFemale, ObjectNames.TivaraWorkerMale]
  }
} satisfies PrefabDefinition;
