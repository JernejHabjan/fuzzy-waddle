// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { getActorComponent } from "../../../data/actor-component";
import ActorInfoLabel from "./ActorInfoLabel";
import { HealthComponent } from "../../../entity/combat/components/health-component";
import { ActorInfoDefinition } from "../../../data/actor-definitions";
import { DamageType } from "../../../entity/combat/damage-type";
import { Subscription } from "rxjs";
import GameObject = Phaser.GameObjects.GameObject;
/* END-USER-IMPORTS */

export default class ActorDetails extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    this.blendMode = Phaser.BlendModes.SKIP_CHECK;

    // actorInfoLabel_1
    const actorInfoLabel_1 = new ActorInfoLabel(scene, 8, 5);
    actorInfoLabel_1.scaleX = 0.5;
    actorInfoLabel_1.scaleY = 0.5;
    this.add(actorInfoLabel_1);
    actorInfoLabel_1.text.setStyle({ fontSize: "12px" });

    // actorInfoLabel_2
    const actorInfoLabel_2 = new ActorInfoLabel(scene, 8, 23);
    actorInfoLabel_2.scaleX = 0.5;
    actorInfoLabel_2.scaleY = 0.5;
    this.add(actorInfoLabel_2);
    actorInfoLabel_2.text.setStyle({ fontSize: "12px" });

    // actorInfoLabel_3
    const actorInfoLabel_3 = new ActorInfoLabel(scene, 66, 5);
    actorInfoLabel_3.scaleX = 0.5;
    actorInfoLabel_3.scaleY = 0.5;
    this.add(actorInfoLabel_3);
    actorInfoLabel_3.text.setStyle({ fontSize: "12px" });

    // actorInfoLabel_4
    const actorInfoLabel_4 = new ActorInfoLabel(scene, 127, 5);
    actorInfoLabel_4.scaleX = 0.5;
    actorInfoLabel_4.scaleY = 0.5;
    this.add(actorInfoLabel_4);
    actorInfoLabel_4.text.setStyle({ fontSize: "12px" });

    // actorInfoLabel_5
    const actorInfoLabel_5 = new ActorInfoLabel(scene, 66, 23);
    actorInfoLabel_5.scaleX = 0.5;
    actorInfoLabel_5.scaleY = 0.5;
    this.add(actorInfoLabel_5);
    actorInfoLabel_5.text.setStyle({ fontSize: "12px" });

    // actorInfoLabel_6
    const actorInfoLabel_6 = new ActorInfoLabel(scene, 127, 23);
    actorInfoLabel_6.scaleX = 0.5;
    actorInfoLabel_6.scaleY = 0.5;
    this.add(actorInfoLabel_6);
    actorInfoLabel_6.text.setStyle({ fontSize: "12px" });

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

  showActorAttributes(actor: GameObject, definition: ActorInfoDefinition) {
    const iconsAndTexts: {
      icon: {
        key: string;
        frame: string;
      };
      text: string;
    }[] = [];
    const tileStepDuration = definition.components?.translatable?.tileStepDuration;
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
      if (primaryDamageType === DamageType.Magical) {
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
      const primaryAttackRange = primaryAttack?.range;
      iconsAndTexts.push({
        icon: { key: "gui", frame: "actor_info_icons/bow.png" },
        text: primaryAttackRange?.toString()
      });
    }

    const healthComponent = getActorComponent(actor, HealthComponent);
    const maxHealth = definition.components?.health?.maxHealth;
    this.healthSubscription?.unsubscribe();
    if (maxHealth) {
      const currentHealth = Math.round(healthComponent!.healthComponentData!.health);
      const health = `${currentHealth}/${maxHealth}`;
      const iconIndex = iconsAndTexts.push({ icon: { key: "gui", frame: "actor_info_icons/heart.png" }, text: health });

      this.healthSubscription = healthComponent!.healthChanged.subscribe((newHealth) => {
        this.attributes[iconIndex - 1].setText(`${Math.round(newHealth)}/${maxHealth}`);
      });
    }

    const maxArmour = definition.components?.health?.maxArmour;
    this.armourSubscription?.unsubscribe();
    if (maxArmour) {
      const currentArmour = Math.round(healthComponent!.healthComponentData.armour);
      const armour = `${currentArmour}/${maxArmour}`;
      const iconIndex = iconsAndTexts.push({
        icon: { key: "gui", frame: "actor_info_icons/shield.png" },
        text: armour
      });

      this.armourSubscription = healthComponent!.armorChanged.subscribe((newArmour) => {
        this.attributes[iconIndex - 1].setText(`${Math.round(newArmour)}/${maxArmour}`);
      });
    }

    this.attributes.forEach((a) => (a.visible = false));
    iconsAndTexts.forEach((info, index) => {
      const label = this.attributes[index];
      label.setIcon(info.icon.key, info.icon.frame, 24);
      label.setText(info.text);
      label.visible = true;
    });
  }
  hideAll() {
    this.attributes.forEach((a) => (a.visible = false));
  }

  destroy(fromScene?: boolean) {
    this.healthSubscription?.unsubscribe();
    this.armourSubscription?.unsubscribe();
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
