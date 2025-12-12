import { treeDefinitions } from "./tree.definition";
import type { PrefabDefinition } from "../../../../definitions/prefab-definition";

export const tree4Definition = {
  ...treeDefinitions,
  components: {
    ...treeDefinitions.components,
    resourceSource: {
      ...treeDefinitions.components!.resourceSource!,
      maximumResources: 40
    },
    representable: {
      width: 128,
      height: 256
    },
    info: {
      ...treeDefinitions.components!.info!,
      smallImage: {
        ...treeDefinitions.components!.info!.smallImage!,
        frame: "foliage/trees/resources/tree4.png"
      }
    }
  }
} satisfies PrefabDefinition;
