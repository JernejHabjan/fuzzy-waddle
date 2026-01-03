// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { IconHelper } from "./IconHelper";
import type { ResourceType } from "@fuzzy-waddle/api-interfaces";
import ActorInfoLabel from "./ActorInfoLabel";
import ActorDetails from "./ActorDetails";
import Resource from "./Resource";
import { getCurrentPlayerNumber, getPlayer } from "../../../data/scene-data";
import { pwActorDefinitions } from "../../definitions/actor-definitions";
import type { TooltipInfo } from "./tooltip-info";
/* END-USER-IMPORTS */

export default class ActorDefinitionTooltip extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 336.6949719548286, y ?? 427.40274978740797);

    // game_actions_bg
    const game_actions_bg = scene.add.nineslice(
      -336.6949719548286,
      -427.40274978740797,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      20,
      20,
      1,
      1,
      1,
      1
    );
    game_actions_bg.scaleX = 16.76840048753606;
    game_actions_bg.scaleY = 21.490989609445222;
    game_actions_bg.setOrigin(0, 0);
    this.add(game_actions_bg);

    // icon
    const icon = scene.add.image(
      -169.6949719548286,
      -378.40274978740797,
      "factions",
      "character_icons/general/warrior.png"
    );
    this.add(icon);

    // title
    const title = scene.add.text(-169.6949719548286, -332.40274978740797, "", {});
    title.setOrigin(0.5, 0);
    title.text = "Actor name";
    title.setStyle({ align: "center", fontFamily: "disposabledroid", fontSize: "26px", maxLines: 2, resolution: 10 });
    title.setWordWrapWidth(300);
    this.add(title);

    // description
    const description = scene.add.text(-169.6949719548286, -277.40274978740797, "", {});
    description.setOrigin(0.5, 0);
    description.text =
      "Actual description of this actor Actual description of this actor Actual description of this actor ";
    description.setStyle({
      align: "center",
      fontFamily: "disposabledroid",
      fontSize: "20px",
      maxLines: 5,
      resolution: 10
    });
    description.setWordWrapWidth(300);
    this.add(description);

    // attributesContainer
    const attributesContainer = scene.add.container(-169.6949719548286, -207.40274978740797);
    this.add(attributesContainer);

    // resourcesNeeded
    const resourcesNeeded = scene.add.text(-309, -167, "", {});
    resourcesNeeded.text = "Resources needed:";
    resourcesNeeded.setStyle({ fontFamily: "disposabledroid", fontSize: "18px" });
    this.add(resourcesNeeded);

    // resourcesContainer
    const resourcesContainer = scene.add.container(-167.6949719548286, -142.40274978740797);
    this.add(resourcesContainer);

    // requirements
    const requirements = scene.add.text(-309, -97, "", {});
    requirements.text = "Requirements:";
    requirements.setStyle({ fontFamily: "disposabledroid", fontSize: "18px" });
    this.add(requirements);

    // requirementsList
    const requirementsList = scene.add.text(-169.6949719548286, -72.40274978740797, "", {});
    requirementsList.setOrigin(0.5, 0);
    requirementsList.setStyle({ color: "#ff0000", fontFamily: "disposabledroid" });
    requirementsList.setWordWrapWidth(300);
    this.add(requirementsList);

    this.game_actions_bg = game_actions_bg;
    this.icon = icon;
    this.title = title;
    this.description = description;
    this.attributesContainer = attributesContainer;
    this.resourcesNeeded = resourcesNeeded;
    this.resourcesContainer = resourcesContainer;
    this.requirements = requirements;
    this.requirementsList = requirementsList;

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  private game_actions_bg: Phaser.GameObjects.NineSlice;
  private icon: Phaser.GameObjects.Image;
  private title: Phaser.GameObjects.Text;
  private description: Phaser.GameObjects.Text;
  private attributesContainer: Phaser.GameObjects.Container;
  private resourcesNeeded: Phaser.GameObjects.Text;
  private resourcesContainer: Phaser.GameObjects.Container;
  private requirements: Phaser.GameObjects.Text;
  private requirementsList: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private readonly padding = 25;
  private readonly sectionPadding = 5;
  private readonly tooltipWidth = 334;
  private readonly iconSize = 64;
  private readonly ninesliceTextureSize = 20;

  private attributeLabels: ActorInfoLabel[] = [];
  private resourceLabels: Resource[] = [];

  private manageAttributeLabels(count: number) {
    while (this.attributeLabels.length < count) {
      const label = new ActorInfoLabel(this.scene, 0, 0);
      this.attributesContainer.add(label);
      this.attributeLabels.push(label);
    }
    this.attributeLabels.forEach((label, index) => {
      label.visible = index < count;
    });
  }

  private manageResourceLabels(count: number) {
    while (this.resourceLabels.length < count) {
      const label = new Resource(this.scene, 0, 0);
      label.static = true;
      this.resourcesContainer.add(label);
      this.resourceLabels.push(label);
    }
    this.resourceLabels.forEach((label, index) => {
      label.visible = index < count;
    });
  }

  setup(tooltipInfo: TooltipInfo) {
    IconHelper.setIcon(this.icon, tooltipInfo.iconKey, tooltipInfo.iconFrame, tooltipInfo.iconOrigin, {
      maxWidth: this.iconSize,
      maxHeight: this.iconSize
    });
    this.title.setText(tooltipInfo.title);
    this.description.setText(tooltipInfo.description);

    // Dynamically position elements
    const topY = this.icon.y - this.icon.displayHeight / 2;
    let yOffset = topY;

    this.icon.y = yOffset + this.icon.displayHeight / 2;
    yOffset += this.icon.displayHeight + this.padding;

    this.title.y = yOffset;
    yOffset += this.title.height + this.padding;

    this.description.y = yOffset;
    yOffset += this.description.height + this.padding;

    // attributes
    const attributes = tooltipInfo.definition
      ? ActorDetails.getActorAttributeIconsAndTexts(tooltipInfo.definition, undefined)
      : [];
    this.manageAttributeLabels(attributes.length);
    if (attributes.length > 0) {
      this.attributesContainer.visible = true;
      this.attributesContainer.y = yOffset;
      const cols = 2;
      const itemWidth = 120;
      const itemHeight = 30;
      const actualCols = Math.min(cols, attributes.length);
      const totalWidth = actualCols * itemWidth;
      const startX = -totalWidth / 2;
      attributes.forEach((attribute, index) => {
        const label = this.attributeLabels[index]!;
        label.setIcon(attribute.icon.key, attribute.icon.frame, 24);
        label.setText(attribute.text);
        label.x = startX + (index % cols) * itemWidth;
        label.y = Math.floor(index / cols) * itemHeight;
      });
      yOffset += Math.ceil(attributes.length / cols) * itemHeight + this.padding;
    } else {
      this.attributesContainer.visible = false;
    }

    // resources
    const cost = tooltipInfo.definition?.components?.productionCost?.resources ?? {};
    const housingCost = tooltipInfo.definition?.components?.housingCost?.housingNeeded;
    const resources = cost ? (Object.keys(cost) as ResourceType[]) : [];
    const totalResourceItems = resources.length + (housingCost ? 1 : 0);

    this.manageResourceLabels(totalResourceItems);
    if (totalResourceItems > 0) {
      this.resourcesNeeded.visible = true;
      this.resourcesNeeded.y = yOffset;
      yOffset += this.resourcesNeeded.height + this.sectionPadding;
      this.resourcesContainer.visible = true;
      this.resourcesContainer.y = yOffset;

      const player = getPlayer(this.scene, getCurrentPlayerNumber(this.scene));

      const resourceLabels: { label: Resource; cost: number; canAfford: boolean; texture: string }[] = [];

      resources.forEach((resource) => {
        resourceLabels.push({
          label: this.resourceLabels[resourceLabels.length]!,
          cost: cost![resource]!,
          canAfford: player?.canPayResources(resource, cost![resource]!) ?? true,
          texture: `resource_icons/${resource}.png`
        });
      });

      if (housingCost) {
        resourceLabels.push({
          label: this.resourceLabels[resourceLabels.length]!,
          cost: housingCost,
          canAfford: player?.canAffordHousing(housingCost) ?? true,
          texture: "resource_icons/food.png" // housing icon
        });
      }

      const cols = 2;
      const itemWidth = 150;
      const itemHeight = 30;
      const startX = -((Math.min(cols, resourceLabels.length) * itemWidth) / 2) + itemWidth / 2;
      resourceLabels.forEach((resourceInfo, index) => {
        const { label, cost, canAfford, texture } = resourceInfo;
        label.resource_icon.setTexture("gui", texture);
        label.setText(cost.toString());
        label.setTextColor(canAfford ? "#ffffff" : "#ff0000");
        label.x = startX + (index % cols) * itemWidth;
        label.y = Math.floor(index / cols) * itemHeight + itemHeight;
      });

      yOffset += Math.ceil(resourceLabels.length / cols) * itemHeight + this.padding;
    } else {
      this.resourcesNeeded.visible = false;
      this.resourcesContainer.visible = false;
    }

    // requirements
    const unmetRequirements = tooltipInfo.unmetRequirements ?? [];
    if (unmetRequirements.length > 0) {
      this.requirements.visible = true;
      this.requirements.y = yOffset;
      yOffset += this.requirements.height + this.sectionPadding;
      this.requirementsList.visible = true;
      this.requirementsList.y = yOffset;
      const requirementNames = unmetRequirements
        .map((req) => pwActorDefinitions[req]?.components?.info?.name ?? req)
        .join(", ");
      this.requirementsList.setText(requirementNames);
      yOffset += this.requirementsList.height;
    } else {
      this.requirements.visible = false;
      this.requirementsList.visible = false;
    }

    // resize bg
    const bgHeight = yOffset + this.padding - this.game_actions_bg.y;
    this.game_actions_bg.scaleX = this.tooltipWidth / this.ninesliceTextureSize;
    this.game_actions_bg.scaleY = bgHeight / this.ninesliceTextureSize;
  }
  /* END-USER-CODE */
}

// You can write more code here
