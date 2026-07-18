import { treeDefinitions } from "./tree.definition";
import type { PrefabDefinition } from "../../../../definitions/prefab-definition";

export const tree10Definition = {
  ...treeDefinitions,
  components: {
    ...treeDefinitions.components,
    resourceSource: {
      ...treeDefinitions.components!.resourceSource!,
      maximumResources: 150
    },
    representable: {
      width: 128,
      height: 152,
      origin: { x: 0.5, y: 0.911458 }
    },
    info: {
      ...treeDefinitions.components!.info!,
      smallImage: {
        ...treeDefinitions.components!.info!.smallImage!,
        frame: "foliage/trees/resources/tree10.png"
      }
    }
  }
} satisfies PrefabDefinition;
