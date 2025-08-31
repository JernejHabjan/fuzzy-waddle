import { treeDefinitions } from "./tree.definition";
import type { PrefabDefinition } from "../../../../../data/prefab-definition";

export const tree10Definition = {
  ...treeDefinitions,
  components: {
    ...treeDefinitions.components,
    resourceSource: {
      ...treeDefinitions.components!.resourceSource!,
      maximumResources: 50
    },
    representable: {
      width: 184,
      height: 184
    }
  }
} satisfies PrefabDefinition;
