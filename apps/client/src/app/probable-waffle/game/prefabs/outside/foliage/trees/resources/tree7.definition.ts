import type { PrefabDefinition } from "../../../../../data/actor-definitions";

export const tree7Definition = {
  ...treeDefinitions,
  components: {
    ...treeDefinitions.components,
    resourceSource: {
      ...treeDefinitions.components!.resourceSource!,
      maximumResources: 60
    },
    representable: {
      width: 128,
      height: 256
    }
  }
} satisfies PrefabDefinition;
