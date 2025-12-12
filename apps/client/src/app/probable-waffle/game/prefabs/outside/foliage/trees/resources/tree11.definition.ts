import { treeDefinitions } from "./tree.definition";
import type { PrefabDefinition } from "../../../../definitions/prefab-definition";

export const tree11Definition = {
  ...treeDefinitions,
  components: {
    ...treeDefinitions.components,
    resourceSource: {
      ...treeDefinitions.components!.resourceSource!,
      maximumResources: 80
    },
    representable: {
      width: 184,
      height: 184
    },
    info: {
      ...treeDefinitions.components!.info!,
      smallImage: {
        ...treeDefinitions.components!.info!.smallImage!,
        frame: "foliage/trees/resources/tree11.png"
      }
    }
  }
} satisfies PrefabDefinition;
