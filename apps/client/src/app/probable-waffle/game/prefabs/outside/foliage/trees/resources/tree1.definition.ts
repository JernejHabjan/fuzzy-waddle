import type { PrefabDefinition } from "../../../../../data/actor-definitions";
import { treeDefinitions } from "./tree.definition";

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
