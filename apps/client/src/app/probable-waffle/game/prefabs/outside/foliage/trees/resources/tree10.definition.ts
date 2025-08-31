import type { PrefabDefinition } from "../../../../../data/actor-definitions";

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
