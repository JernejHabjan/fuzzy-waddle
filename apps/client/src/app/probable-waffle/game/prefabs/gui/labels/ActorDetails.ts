// You can write more code here

/* START OF COMPILED CODE */

import ActorInfoLabel from "./ActorInfoLabel";
/* START-USER-IMPORTS */
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { DamageType } from "../../../entity/components/combat/damage-type";
import { Subscription } from "rxjs";
import GameObject = Phaser.GameObjects.GameObject;
import type { PrefabDefinition } from "../../definitions/prefab-definition";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
/* END-USER-IMPORTS */

export default class ActorDetails extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    // actorInfoLabel_1
    const actorInfoLabel_1 = new ActorInfoLabel(scene, 8, 5);
    actorInfoLabel_1.scaleX = 0.5;
    actorInfoLabel_1.scaleY = 0.5;
    this.add(actorInfoLabel_1);
    actorInfoLabel_1.text.setStyle({ fontSize: "20px" });

    // actorInfoLabel_2
    const actorInfoLabel_2 = new ActorInfoLabel(scene, 8, 23);
    actorInfoLabel_2.scaleX = 0.5;
    actorInfoLabel_2.scaleY = 0.5;
    this.add(actorInfoLabel_2);
    actorInfoLabel_2.text.setStyle({ fontSize: "20px" });

    // actorInfoLabel_3
    const actorInfoLabel_3 = new ActorInfoLabel(scene, 66, 5);
    actorInfoLabel_3.scaleX = 0.5;
    actorInfoLabel_3.scaleY = 0.5;
    this.add(actorInfoLabel_3);
    actorInfoLabel_3.text.setStyle({ fontSize: "20px" });

    // actorInfoLabel_4
    const actorInfoLabel_4 = new ActorInfoLabel(scene, 127, 5);
    actorInfoLabel_4.scaleX = 0.5;
    actorInfoLabel_4.scaleY = 0.5;
    this.add(actorInfoLabel_4);
    actorInfoLabel_4.text.setStyle({ fontSize: "20px" });

    // actorInfoLabel_5
    const actorInfoLabel_5 = new ActorInfoLabel(scene, 66, 23);
    actorInfoLabel_5.scaleX = 0.5;
    actorInfoLabel_5.scaleY = 0.5;
    this.add(actorInfoLabel_5);
    actorInfoLabel_5.text.setStyle({ fontSize: "20px" });

    // actorInfoLabel_6
    const actorInfoLabel_6 = new ActorInfoLabel(scene, 127, 23);
    actorInfoLabel_6.scaleX = 0.5;
    actorInfoLabel_6.scaleY = 0.5;
    this.add(actorInfoLabel_6);
    actorInfoLabel_6.text.setStyle({ fontSize: "20px" });

    // lists
    const attributes = [
      actorInfoLabel_1,
      actorInfoLabel_2,
      actorInfoLabel_3,
      actorInfoLabel_5,
      actorInfoLabel_4,
      actorInfoLabel_6
    ];

    this.attributes = attributes;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  private attributes: ActorInfoLabel[];

  /* START-USER-CODE */
  private healthSubscription?: Subscription;
  private armourSubscription?: Subscription;
  private resourcesChangedSubscription?: Subscription;
  private assignedGatherersChangedSubscription?: Subscription;

  static getActorAttributeIconsAndTexts(
    definition: PrefabDefinition,
    actor?: GameObject
  ): {
    icon: {
      key: string;
      frame: string;
    };
    text: string;
  }[] {
    const iconsAndTexts: {
      icon: {
        key: string;
        frame: string;
      };
      text: string;
    }[] = [];

    const maxHealth = definition.components?.health?.maxHealth;
    if (maxHealth) {
      iconsAndTexts.push({ icon: { key: "gui", frame: "actor_info_icons/heart.png" }, text: maxHealth.toString() });
    }

    const maxArmour = definition.components?.health?.maxArmour;
    if (maxArmour) {
      iconsAndTexts.push({ icon: { key: "gui", frame: "actor_info_icons/shield.png" }, text: maxArmour.toString() });
    }

    // Check if this is a resource source
    const resourceSourceComponent = actor ? getActorComponent(actor, ResourceSourceComponent) : undefined;
    if (resourceSourceComponent) {
      // Show remaining resources
      const currentResources = resourceSourceComponent.getCurrentResources();
      const maxResources = resourceSourceComponent.getMaximumResources();
      const resourcesText = `${currentResources}/${maxResources}`;
      iconsAndTexts.push({
        icon: { key: "gui", frame: "actor_info_icons/element.png" }, // todo
        text: resourcesText
      });

      // Show assigned gatherers count
      const assignedCount = resourceSourceComponent.getAssignedGatherersCount();
      const gatherersText = assignedCount === 1 ? "1 gatherer" : `${assignedCount} gatherers`;
      iconsAndTexts.push({
        icon: { key: "gui", frame: "actor_info_icons/element.png" }, // todo
        text: gatherersText
      });

      return iconsAndTexts;
    }

    const tileStepDuration = definition.components?.translatable?.tileMoveDuration;
    if (tileStepDuration) {
      const movementSpeed = (1000 / tileStepDuration).toFixed(1) + " t/s";
      iconsAndTexts.push({
        icon: { key: "gui", frame: "actor_info_icons/boot.png" },
        text: movementSpeed
      });
    }

    const primaryAttack = definition.components?.attack?.attacks[0];
    if (primaryAttack) {
      const primaryAttackCooldown = primaryAttack?.cooldown;
      const attackSpeed = (primaryAttackCooldown ? (1000 / primaryAttackCooldown).toFixed(1) : "N/A") + " atk/s";
      iconsAndTexts.push({ icon: { key: "gui", frame: "actor_info_icons/speed_attack.png" }, text: attackSpeed });

      const primaryDamageType = primaryAttack?.damageType;
      const primaryAttackDamage = primaryAttack?.damage;
      if (
        primaryDamageType === DamageType.Fire ||
        primaryDamageType === DamageType.Frost ||
        primaryDamageType === DamageType.Poison
      ) {
        iconsAndTexts.push({
          icon: { key: "gui", frame: "actor_info_icons/element.png" },
          text: primaryAttackDamage?.toString()
        });
      } else {
        iconsAndTexts.push({
          icon: { key: "gui", frame: "actor_info_icons/sword.png" },
          text: primaryAttackDamage?.toString()
        });
      }
      iconsAndTexts.push({
        icon: { key: "gui", frame: "actor_info_icons/bow.png" },
        text: primaryAttack?.range.toString()
      });
      const highGroundBonus = primaryAttack?.highGroundRangeBonus;
      if (highGroundBonus && highGroundBonus > 0) {
        iconsAndTexts.push({
          icon: { key: "gui", frame: "actor_info_icons/high-ground.png" }, // todo
          text: highGroundBonus.toString()
        });
      }
    }

    return iconsAndTexts;
  }

  showActorAttributes(actor: GameObject, definition: PrefabDefinition) {
    const iconsAndTexts = ActorDetails.getActorAttributeIconsAndTexts(definition, actor);

    // Check if this is a resource source
    const resourceSourceComponent = getActorComponent(actor, ResourceSourceComponent);
    if (resourceSourceComponent) {
      const maxResources = resourceSourceComponent.getMaximumResources();
      // Subscribe to resource changes
      this.resourcesChangedSubscription?.unsubscribe();
      this.resourcesChangedSubscription = resourceSourceComponent.onResourcesChanged.subscribe(() => {
        const attribute = this.attributes[0];
        if (!attribute) return;
        const updatedResources = resourceSourceComponent.getCurrentResources();
        attribute.setText(`${updatedResources}/${maxResources}`);
      });

      // Subscribe to gatherer count changes
      this.assignedGatherersChangedSubscription?.unsubscribe();
      this.assignedGatherersChangedSubscription = resourceSourceComponent.onAssignedGatherersChanged.subscribe(
        (count) => {
          const attribute = this.attributes[1];
          if (!attribute) return;
          attribute.setText(count === 1 ? "1 gatherer" : `${count} gatherers`);
        }
      );
    }

    const healthComponent = getActorComponent(actor, HealthComponent);
    const maxHealth = definition.components?.health?.maxHealth;
    this.healthSubscription?.unsubscribe();
    if (maxHealth) {
      const currentHealth = Math.round(healthComponent!.healthComponentData!.health);
      const health = `${currentHealth}/${maxHealth}`;
      const healthInfo = iconsAndTexts.find((i) => i.icon.frame === "actor_info_icons/heart.png");
      if (healthInfo) {
        healthInfo.text = health;
      }

      this.healthSubscription = healthComponent!.healthChanged.subscribe((newHealth) => {
        const attribute = this.attributes.find(
          (a) => a.icon.frame.texture.key === "gui" && a.icon.frame.name === "actor_info_icons/heart.png"
        );
        if (!attribute) return;
        attribute.setText(`${Math.round(newHealth)}/${maxHealth}`);
      });
    }

    const maxArmour = definition.components?.health?.maxArmour;
    this.armourSubscription?.unsubscribe();
    if (maxArmour) {
      const currentArmour = Math.round(healthComponent!.healthComponentData.armour);
      const armour = `${currentArmour}/${maxArmour}`;
      const armourInfo = iconsAndTexts.find((i) => i.icon.frame === "actor_info_icons/shield.png");
      if (armourInfo) {
        armourInfo.text = armour;
      }

      this.armourSubscription = healthComponent!.armorChanged.subscribe((newArmour) => {
        const icon = this.attributes.find(
          (a) => a.icon.frame.texture.key === "gui" && a.icon.frame.name === "actor_info_icons/shield.png"
        );
        if (!icon) return;
        icon.setText(`${Math.round(newArmour)}/${maxArmour}`);
      });
    }

    this.attributes.forEach((a) => (a.visible = false));
    iconsAndTexts.forEach((info, index) => {
      const label = this.attributes[index];
      if (!label) return;
      label.setIcon(info.icon.key, info.icon.frame, 24);
      label.setText(info.text);
      label.visible = true;
    });
  }
  hideAll() {
    this.attributes.forEach((a) => (a.visible = false));
    this.resourcesChangedSubscription?.unsubscribe();
    this.assignedGatherersChangedSubscription?.unsubscribe();
  }

  override destroy(fromScene?: boolean) {
    this.healthSubscription?.unsubscribe();
    this.armourSubscription?.unsubscribe();
    this.resourcesChangedSubscription?.unsubscribe();
    this.assignedGatherersChangedSubscription?.unsubscribe();
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
