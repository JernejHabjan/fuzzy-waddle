import { expect, test } from "@playwright/test";
import { HIGH_GROUND_THRESHOLD } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/high-ground-constants";
import { isWithinObservedGroundWeaponRange } from "./skirmish-ai-native-weapon-range";

const towerAttack = {
  damage: 20,
  minRange: 0,
  range: 7,
  highGroundRangeBonus: 2,
  targetDomains: ["ground"]
};

test("native placement evidence applies high-ground range bonus only at greater elevation", () => {
  expect(isWithinObservedGroundWeaponRange({ x: 0, y: 0, z: 0 }, { x: 7, y: 0, z: 0 }, [towerAttack])).toBe(true);
  expect(isWithinObservedGroundWeaponRange({ x: 0, y: 0, z: 0 }, { x: 9, y: 0, z: 0 }, [towerAttack])).toBe(false);
  expect(
    isWithinObservedGroundWeaponRange({ x: 0, y: 0, z: HIGH_GROUND_THRESHOLD }, { x: 9, y: 0, z: 0 }, [towerAttack])
  ).toBe(true);
  expect(
    isWithinObservedGroundWeaponRange({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, [{ ...towerAttack, minRange: 2 }])
  ).toBe(false);
});
