export enum TechTreeNodeType {
  TechTreeNodeType_Research,
  TechTreeNodeType_Unit,
  TechTreeNodeType_Structure
}

export class TechTreeDependency {
  constructor(
    public techTreeNodeId: string,
    public techTreeNodeDependencyId: string | null,
    public description: string,
    public techTreeDependencyType: TechTreeDependencyType,
    public techTreeDependencyValue: number | null
  ) {}
}

export enum TechTreeDependencyType {
  // example "Requires 10 units of resource X"

  TechTreeDependencyType_Resource,
  TechTreeDependencyType_TechTreeNode
}

export class TechTreeEffect {
  constructor(
    public techTreeEffectId: string,
    public techTreeNodeId: string,
    public techTreeEffectType: TechTreeEffectType,
    public techTreeEffectValue: number
  ) {}

  // example "Increases unit production speed by 10%"
  // example "Increases unit production speed by 10% for each unit of resource X"
}

export enum TechTreeEffectType {
  TechTreeEffectType_Resource,
  TechTreeEffectType_TechTreeNode
}

export class TechTree {
  constructor(
    public techTreeId: string,
    public name: string,
    public techTreeNodes: TechTreeNode[]
  ) {}
}

export class TechTreeNode {
  constructor(
    public techTreeNodeId: string,
    public name: string, // example "Unit Production Speed"
    public description: string,
    public techTreeNodeType: TechTreeNodeType, // example "Unit" to indicate that this is a unit production speed upgrade
    public techTreeDependencies: TechTreeDependency[], // resources and previous Tree nodes required to unlock this node
    public techTreeEffects: TechTreeEffect[] // example "Increases unit production speed by 10%" and "Increases unit production speed by 10% for each unit of resource X"
  ) {}
}

export class TechTreeComponent {
  // below techTree specified for barracks:
  // it attaches to building as component
  // 1. Upgrade for unit production speed
  //    1. requires 10 units of resource X
  //    2. requires previous tech tree node
  //    3. increases unit production speed by 10%
  // 2. Militia unit
  techTreeBarracks = new TechTree("12313", "Barracks", [
    new TechTreeNode(
      "134343",
      "Unit Production Speed",
      "Unit Production Speed",
      TechTreeNodeType.TechTreeNodeType_Research,
      [
        new TechTreeDependency(
          "434343",
          null,
          "Requires 10 units of resource X",
          TechTreeDependencyType.TechTreeDependencyType_Resource,
          10
        ),
        new TechTreeDependency(
          "434",
          "434343",
          "requires previous tech tree node",
          TechTreeDependencyType.TechTreeDependencyType_TechTreeNode,
          null
        )
      ],
      [
        new TechTreeEffect(
          "4344343",
          "Increases unit production speed by 10%",
          TechTreeEffectType.TechTreeEffectType_TechTreeNode,
          10
        )
      ]
    ),
    new TechTreeNode("4343", "Militia", "Militia", TechTreeNodeType.TechTreeNodeType_Unit, [], [])
  ]);

  // below techTree specifies what alien structures are available
  // it attaches to playerController and is used to determine what structures are available to build
  // 1. Alien Barracks structure
  techTreeAlien = new TechTree("12313", "Alien", [
    new TechTreeNode("432", "Alien Barracks", "Alien Barracks", TechTreeNodeType.TechTreeNodeType_Structure, [], [])
  ]);

  checkHasAllTechTreeDependencies = (techTreeDependencies: TechTreeDependency[], techTree: TechTree) => {
    const hasAllTechTreeDependencies = techTreeDependencies.every((techTreeDependency) => {
      const techTreeNode = techTree.techTreeNodes.find(
        (techTreeNode) => techTreeNode.techTreeNodeId === techTreeDependency.techTreeNodeId
      );
      if (!techTreeNode) {
        return false;
      }
      if (techTreeDependency.techTreeDependencyType === TechTreeDependencyType.TechTreeDependencyType_Resource) {
        const resource = techTreeNode.techTreeEffects.find(
          (techTreeEffect) => techTreeEffect.techTreeEffectType === TechTreeEffectType.TechTreeEffectType_Resource
        );
        if (!resource) {
          return false;
        }
        return (
          techTreeDependency.techTreeDependencyValue == null ||
          resource.techTreeEffectValue >= techTreeDependency.techTreeDependencyValue
        );
      }
      if (techTreeDependency.techTreeDependencyType === TechTreeDependencyType.TechTreeDependencyType_TechTreeNode) {
        const techTreeNodeDependency = techTreeNode.techTreeEffects.find(
          (techTreeEffect) => techTreeEffect.techTreeEffectType === TechTreeEffectType.TechTreeEffectType_TechTreeNode
        );
        if (!techTreeNodeDependency) {
          return false;
        }
        return (
          techTreeDependency.techTreeDependencyValue == null ||
          techTreeNodeDependency.techTreeEffectValue >= techTreeDependency.techTreeDependencyValue
        );
      }
      return false;
    });
  };
}
