import { treeDefinitions } from "./tree.definition";
import type { PrefabDefinition } from "../../../../definitions/prefab-definition";

export const tree1Definition = {
  ...treeDefinitions,
  components: {
    ...treeDefinitions.components,
    resourceSource: {
      ...treeDefinitions.components!.resourceSource!,
      maximumResources: 40
    },
    representable: {
      width: 128,
      height: 384
    }
  }
} satisfies PrefabDefinition;
