import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { getCurrentPlayerNumber, getPlayer, listenToPlayerChangedChanged } from "../../../data/scene-data";
import { Subscription } from "rxjs";
import { ProbableWafflePlayer } from "@fuzzy-waddle/probable-waffle-protocol";
import ActorDefinitionTooltip from "./ActorDefinitionTooltip";
import { getGameObjectBounds } from "../../../data/game-object-helper";
import type { TooltipInfo } from "./tooltip-info";
/* END-USER-IMPORTS */

export default class Resource extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 71.80414581298828, y ?? 32.202178808720916);

    // resource_text
    const resource_text = scene.add.text(4, -15, "", {});
    resource_text.setOrigin(0.5, 0.5);
    resource_text.text = "1000";
    resource_text.setStyle({ fixedWidth: 80, fontFamily: "disposabledroid", fontSize: "22px", resolution: 10 });
    this.add(resource_text);

    // resource_icon
    const resource_icon = scene.add.image(-56, -4, "gui", "resource_icons/food.png");
    resource_icon.setOrigin(0.5, 0.9);
    this.add(resource_icon);

    this.resource_text = resource_text;
    this.resource_icon = resource_icon;

    /* START-USER-CTR-CODE */
    this.player = getPlayer(scene, getCurrentPlayerNumber(scene));
    this.scene.events.once(Phaser.Scenes.Events.CREATE, this.init);
    /* END-USER-CTR-CODE */
  }

  private resource_text: Phaser.GameObjects.Text;
  public resource_icon: Phaser.GameObjects.Image;
  public override type: "wood" | "stone" | "minerals" | "food" | "housing" | "" = "";
  public static = false;

  /* START-USER-CODE */
  private readonly player: ProbableWafflePlayer | undefined;
  private resourceChangedSubscription?: Subscription;
  private housingChangedSubscription?: Subscription;
  private housingTooltip?: ActorDefinitionTooltip;
  private housingTooltipDelay?: Phaser.Time.TimerEvent;
  private housingPointerIn = false;

  private readonly housingTooltipInfo: TooltipInfo = {
    iconKey: "gui",
    iconFrame: "resource_icons/food.png",
    iconOrigin: { x: 0.5, y: 0.5 },
    title: "Housing",
    description: "Housing determines your population limit. Build housing before training more units."
  };

  private init = () => {
    this.assignResourceText();
    this.listenToResourceChanged();
    if (this.type === "housing") this.enableHousingTooltip();
  };

  private listenToResourceChanged() {
    if (this.static) return;
    this.resourceChangedSubscription = listenToPlayerChangedChanged(this.scene, "resource.")?.subscribe(
      this.assignResourceText
    );
    this.housingChangedSubscription = listenToPlayerChangedChanged(this.scene, "housing.")?.subscribe(
      this.assignResourceText
    );
  }

  setText(text: string) {
    this.resource_text.text = text;
  }

  setTextColor(color: string) {
    this.resource_text.setColor(color);
  }

  private getPlayerResource(): string {
    if (!this.player) return "";
    const resources = this.player.playerState.data.resources;
    switch (this.type) {
      case "wood":
        return resources.wood.toString();
      case "stone":
        return resources.stone.toString();
      case "minerals":
        return resources.minerals.toString();
      case "food":
        return resources.food.toString();
      case "housing":
        const housing = this.player.playerState.data.housing;
        return housing.currentHousing + "/" + housing.maxHousing;
      default:
        return "";
    }
  }

  private assignResourceText = () => {
    this.resource_text.text = this.getPlayerResource();
  };

  /**
   * Makes the housing counter explain its supply-limit role without changing the existing HUD art.
   * The hit area covers both the icon and the displayed current/maximum value, which are positioned
   * around this container's origin by the editor-authored prefab.
   */
  private enableHousingTooltip(): void {
    this.setInteractive(new Phaser.Geom.Rectangle(-96, -30, 144, 52), Phaser.Geom.Rectangle.Contains);
    if (this.input) this.input.cursor = "pointer";
    this.on(Phaser.Input.Events.POINTER_OVER, this.onHousingPointerOver);
    this.on(Phaser.Input.Events.POINTER_OUT, this.onHousingPointerOut);
  }

  private readonly onHousingPointerOver = (): void => {
    this.housingPointerIn = true;
    this.housingTooltipDelay = this.scene.time.delayedCall(400, this.showHousingTooltip);
  };

  private readonly onHousingPointerOut = (): void => {
    this.housingPointerIn = false;
    this.destroyHousingTooltip();
  };

  /**
   * Displays the shared definition-tooltip prefab underneath the top HUD, then clamps it to the viewport.
   * Housing is positioned at the screen edge, so placing the tooltip above it would be clipped.
   */
  private readonly showHousingTooltip = (): void => {
    this.housingTooltipDelay = undefined;
    if (!this.housingPointerIn || this.housingTooltip) return;

    const resourceBounds = getGameObjectBounds(this);
    if (!resourceBounds) return;

    const tooltip = new ActorDefinitionTooltip(this.scene, 0, 0);
    tooltip.setup(this.housingTooltipInfo);
    this.scene.add.existing(tooltip);

    const tooltipBounds = tooltip.getBackgroundBounds();
    if (!tooltipBounds) {
      tooltip.destroy();
      return;
    }

    const margin = 4;
    const x = Phaser.Math.Clamp(
      resourceBounds.centerX - tooltipBounds.centerX,
      margin - tooltipBounds.left,
      this.scene.scale.width - margin - tooltipBounds.right
    );
    tooltip.setPosition(x, resourceBounds.bottom - tooltipBounds.top + margin);
    this.housingTooltip = tooltip;
  };

  private destroyHousingTooltip(): void {
    this.housingTooltipDelay?.remove(false);
    this.housingTooltipDelay = undefined;
    this.housingTooltip?.destroy();
    this.housingTooltip = undefined;
  }

  override destroy(fromScene?: boolean) {
    this.off(Phaser.Input.Events.POINTER_OVER, this.onHousingPointerOver);
    this.off(Phaser.Input.Events.POINTER_OUT, this.onHousingPointerOut);
    this.destroyHousingTooltip();
    super.destroy(fromScene);
    this.resourceChangedSubscription?.unsubscribe();
    this.housingChangedSubscription?.unsubscribe();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
