// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { IconHelper } from "./IconHelper";
import type { Vector2Simple, ResourceType, ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { PrefabDefinition } from "../../definitions/prefab-definition";
import ActorInfoLabel from "./ActorInfoLabel";
import ActorDetails from "./ActorDetails";
import Resource from "./Resource";
import { getCurrentPlayerNumber, getPlayer } from "../../../data/scene-data";
import { pwActorDefinitions } from "../../definitions/actor-definitions";
/* END-USER-IMPORTS */

export default class ActorDefinitionTooltip extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    // game_actions_bg
    const game_actions_bg = scene.add.nineslice(
      1,
      0,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      20,
      20,
      1,
      1,
      1,
      1
    );
    game_actions_bg.scaleX = 12.430939264477326;
    game_actions_bg.scaleY = 15.778213319031138;
    game_actions_bg.setOrigin(0, 0);
    this.add(game_actions_bg);

    // icon
    const icon = scene.add.image(131, 49, "factions", "character_icons/general/warrior.png");
    this.add(icon);

    // title
    const title = scene.add.text(129, 77, "", {});
    title.setOrigin(0.5, 0);
    title.text = "Actor name";
    title.setStyle({ align: "center", fontFamily: "disposabledroid", fontSize: "26px", maxLines: 2, resolution: 10 });
    title.setWordWrapWidth(220);
    this.add(title);

    // description
    const description = scene.add.text(125, 123, "", {});
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
    description.setWordWrapWidth(220);
    this.add(description);

    // attributesContainer
    const attributesContainer = scene.add.container(20, 180);
    this.add(attributesContainer);

    // resourcesNeeded
    const resourcesNeeded = scene.add.text(20, 220, "", {});
    resourcesNeeded.text = "Resources needed:";
    resourcesNeeded.setStyle({ fontFamily: "disposabledroid", fontSize: "18px" });
    this.add(resourcesNeeded);

    // resourcesContainer
    const resourcesContainer = scene.add.container(20, 240);
    this.add(resourcesContainer);

    // requirements
    const requirements = scene.add.text(20, 280, "", {});
    requirements.text = "Requirements:";
    requirements.setStyle({ fontFamily: "disposabledroid", fontSize: "18px" });
    this.add(requirements);

    // requirementsList
    const requirementsList = scene.add.text(20, 300, "", {});
    requirementsList.setStyle({ fontFamily: "disposabledroid", fontSize: "16px", color: "#ff0000" });
    requirementsList.setWordWrapWidth(220);
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
    // Write your code here.
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
  private attributeLabels: ActorInfoLabel[] = [];
  private resourceLabels: Resource[] = [];

  private manageAttributeLabels(count: number) {
    while (this.attributeLabels.length < count) {
      const label = new ActorInfoLabel(this.scene, 0, 0);
      label.scale = 0.4;
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
      label.scale = 0.8;
      this.resourcesContainer.add(label);
      this.resourceLabels.push(label);
    }
    this.resourceLabels.forEach((label, index) => {
      label.visible = index < count;
    });
  }

  setup(tooltipInfo: TooltipInfo) {
    const tooltipIconSize = 64;
    IconHelper.setIcon(this.icon, tooltipInfo.iconKey, tooltipInfo.iconFrame, tooltipInfo.iconOrigin, {
      maxWidth: tooltipIconSize,
      maxHeight: tooltipIconSize
    });
    this.title.setText(tooltipInfo.title);
    this.description.setText(tooltipInfo.description);

    let yOffset = this.description.y + this.description.height + 10;

    // attributes
    const attributes = tooltipInfo.definition
      ? ActorDetails.getActorAttributeIconsAndTexts(tooltipInfo.definition)
      : [];
    this.manageAttributeLabels(attributes.length);
    if (attributes.length > 0) {
      this.attributesContainer.visible = true;
      this.attributesContainer.y = yOffset;
      const cols = 3;
      const itemWidth = 80;
      const itemHeight = 30;
      attributes.forEach((attribute, index) => {
        const label = this.attributeLabels[index]!;
        label.setIcon(attribute.icon.key, attribute.icon.frame, 24);
        label.setText(attribute.text);
        label.x = (index % cols) * itemWidth;
        label.y = Math.floor(index / cols) * itemHeight;
      });
      yOffset = this.attributesContainer.y + Math.ceil(attributes.length / cols) * itemHeight;
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
      yOffset += this.resourcesNeeded.height + 5;
      this.resourcesContainer.visible = true;
      this.resourcesContainer.y = yOffset;

      const player = getPlayer(this.scene, getCurrentPlayerNumber(this.scene));
      const canAfford = player?.canPayAllResources(cost) ?? true;

      resources.forEach((resource, index) => {
        const label = this.resourceLabels[index]!;
        label.resource_icon.setTexture("gui", `resource_icons/${resource}.png`);
        label.setText(cost![resource]!.toString());
        label.setTextColor(canAfford ? "#ffffff" : "#ff0000");
        label.x = index * 90;
      });

      if (housingCost) {
        const housingLabel = this.resourceLabels[resources.length]!;
        const canAffordHousing = player?.canAffordHousing(housingCost) ?? true;
        housingLabel.resource_icon.setTexture("gui", "resource_icons/food.png"); // housing icon
        housingLabel.setText(housingCost.toString());
        housingLabel.setTextColor(canAffordHousing ? "#ffffff" : "#ff0000");
        housingLabel.x = resources.length * 90;
      }

      yOffset = this.resourcesContainer.y + 30;
    } else {
      this.resourcesNeeded.visible = false;
      this.resourcesContainer.visible = false;
    }

    // requirements
    const unmetRequirements = tooltipInfo.unmetRequirements ?? [];
    if (unmetRequirements.length > 0) {
      this.requirements.visible = true;
      this.requirements.y = yOffset;
      yOffset += this.requirements.height + 5;
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
    // todo this.game_actions_bg.height = yOffset + 10;
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */
export type TooltipInfo = {
  iconKey: string;
  iconFrame: string;
  iconOrigin: Vector2Simple;
  title: string;
  description: string;
  definition?: PrefabDefinition;
  unmetRequirements?: ObjectNames[];
};
// You can write more code here
