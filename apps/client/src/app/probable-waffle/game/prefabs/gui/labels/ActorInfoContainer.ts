// You can write more code here

/* START OF COMPILED CODE */

import ActorInfoLabel from "./ActorInfoLabel";
/* START-USER-IMPORTS */
import HudProbableWaffle from "../../../scenes/HudProbableWaffle";
import { Subscription } from "rxjs";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSelectedActors, listenToSelectionEvents } from "../../../data/scene-data";
import { ActorDefinition, pwActorDefinitions } from "../../../data/actor-definitions";
import { ObjectNames } from "../../../data/object-names";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/combat/components/health-component";
import { DamageType } from "../../../entity/combat/damage-type";
import GameObject = Phaser.GameObjects.GameObject;
/* END-USER-IMPORTS */

export default class ActorInfoContainer extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 214.40086535603183, y ?? 81.33939079440076);

    // actor_info_bg
    const actor_info_bg = scene.add.nineslice(
      -214.40086535603183,
      -81.33939079440076,
      "gui",
      "cryos_mini_gui/surfaces/surface_parchment.png",
      32,
      16,
      3,
      3,
      3,
      3
    );
    actor_info_bg.scaleX = 6.711135518221706;
    actor_info_bg.scaleY = 5.076854073573915;
    actor_info_bg.setOrigin(0, 0);
    this.add(actor_info_bg);

    // actorInfoLabel
    const actorInfoLabel = new ActorInfoLabel(scene, -196, -62);
    actorInfoLabel.scaleX = 0.5;
    actorInfoLabel.scaleY = 0.5;
    this.add(actorInfoLabel);
    actorInfoLabel.text.setStyle({});

    // actorInfoLabel_1
    const actorInfoLabel_1 = new ActorInfoLabel(scene, -197, -44);
    actorInfoLabel_1.scaleX = 0.5;
    actorInfoLabel_1.scaleY = 0.5;
    this.add(actorInfoLabel_1);
    actorInfoLabel_1.text.setStyle({ fontSize: "12px" });

    // actorInfoLabel_2
    const actorInfoLabel_2 = new ActorInfoLabel(scene, -199, -26);
    actorInfoLabel_2.scaleX = 0.5;
    actorInfoLabel_2.scaleY = 0.5;
    this.add(actorInfoLabel_2);
    actorInfoLabel_2.text.setStyle({ fontSize: "12px" });

    // actorInfoLabel_3
    const actorInfoLabel_3 = new ActorInfoLabel(scene, -138, -44);
    actorInfoLabel_3.scaleX = 0.5;
    actorInfoLabel_3.scaleY = 0.5;
    this.add(actorInfoLabel_3);
    actorInfoLabel_3.text.setStyle({ fontSize: "12px" });

    // actorInfoLabel_4
    const actorInfoLabel_4 = new ActorInfoLabel(scene, -77, -44);
    actorInfoLabel_4.scaleX = 0.5;
    actorInfoLabel_4.scaleY = 0.5;
    this.add(actorInfoLabel_4);
    actorInfoLabel_4.text.setStyle({ fontSize: "12px" });

    // actorInfoLabel_5
    const actorInfoLabel_5 = new ActorInfoLabel(scene, -139, -26);
    actorInfoLabel_5.scaleX = 0.5;
    actorInfoLabel_5.scaleY = 0.5;
    this.add(actorInfoLabel_5);
    actorInfoLabel_5.text.setStyle({ fontSize: "12px" });

    // actorInfoLabel_6
    const actorInfoLabel_6 = new ActorInfoLabel(scene, -77, -26);
    actorInfoLabel_6.scaleX = 0.5;
    actorInfoLabel_6.scaleY = 0.5;
    this.add(actorInfoLabel_6);
    actorInfoLabel_6.text.setStyle({ fontSize: "12px" });

    // lists
    const attributes = [
      actorInfoLabel_1,
      actorInfoLabel_2,
      actorInfoLabel_3,
      actorInfoLabel_4,
      actorInfoLabel_5,
      actorInfoLabel_6
    ];

    this.actorInfoLabel = actorInfoLabel;
    this.actorInfoLabel_1 = actorInfoLabel_1;
    this.actorInfoLabel_2 = actorInfoLabel_2;
    this.actorInfoLabel_3 = actorInfoLabel_3;
    this.actorInfoLabel_4 = actorInfoLabel_4;
    this.actorInfoLabel_5 = actorInfoLabel_5;
    this.actorInfoLabel_6 = actorInfoLabel_6;
    this.attributes = attributes;

    /* START-USER-CTR-CODE */
    this.mainSceneWithActors = (scene as HudProbableWaffle).parentScene!;
    this.subscribeToPlayerSelection();
    this.hideAllLabels();
    /* END-USER-CTR-CODE */
  }

  private actorInfoLabel: ActorInfoLabel;
  private actorInfoLabel_1: ActorInfoLabel;
  private actorInfoLabel_2: ActorInfoLabel;
  private actorInfoLabel_3: ActorInfoLabel;
  private actorInfoLabel_4: ActorInfoLabel;
  private actorInfoLabel_5: ActorInfoLabel;
  private actorInfoLabel_6: ActorInfoLabel;
  private attributes: ActorInfoLabel[];

  /* START-USER-CODE */

  private selectionChangedSubscription?: Subscription;
  private readonly mainSceneWithActors: ProbableWaffleScene;
  private subscribeToPlayerSelection() {
    this.selectionChangedSubscription = listenToSelectionEvents(this.scene)?.subscribe(() => {
      const selectedActors = getSelectedActors(this.mainSceneWithActors);
      if (selectedActors.length === 0) {
        this.hideAllLabels();
        return;
      } else {
        const actor = selectedActors[0];
        const definition = pwActorDefinitions[actor.name as ObjectNames];
        if (!definition) {
          throw new Error(`Actor definition for ${actor.name} not found.`);
        }

        const infoDefinition = definition.components?.info;

        this.actorInfoLabel.setText(infoDefinition?.name ?? "");
        this.actorInfoLabel.setIcon(infoDefinition?.smallImage?.key, infoDefinition?.smallImage?.frame);

        this.actorInfoLabel.visible = true;

        this.showActorAttributes(actor, definition);
      }
    });
  }

  private showActorAttributes(actor: GameObject, definition: ActorDefinition) {
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
    if (maxHealth) {
      const currentHealth = healthComponent ? healthComponent.healthComponentData?.health : null;
      const health = `${currentHealth}/${maxHealth}`;
      iconsAndTexts.push({ icon: { key: "gui", frame: "actor_info_icons/heart.png" }, text: health });
    }

    const maxArmour = definition.components?.health?.maxArmour;
    if (maxArmour) {
      const currentArmour = healthComponent ? healthComponent.healthComponentData?.armour : null;
      const armour = `${currentArmour}/${maxArmour}`;
      iconsAndTexts.push({ icon: { key: "gui", frame: "actor_info_icons/shield.png" }, text: armour });
    }

    this.attributes.forEach((a) => (a.visible = false));
    iconsAndTexts.forEach((info, index) => {
      const label = this.attributes[index];
      label.setIcon(info.icon.key, info.icon.frame, 24);
      label.setText(info.text);
      label.visible = true;
    });
  }

  private hideAllLabels() {
    this.actorInfoLabel.visible = false;
    this.attributes.forEach((a) => (a.visible = false));
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.selectionChangedSubscription?.unsubscribe();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
