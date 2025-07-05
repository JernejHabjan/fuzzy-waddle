import { Injectable } from "@angular/core";

export type Achievement = {
  name: string;
  description: string;
  image: string;
  unlocked: boolean;
  date?: Date; // Date when the achievement was unlocked
};

@Injectable({
  providedIn: "root"
})
export class DEPRECATED_gameInstanceService {
  getPlayerProgress = () => ["level1"];
  getAchievements = (): Achievement[] => [
    {
      name: "Level 1",
      description: "Complete level 1",
      image: "actor_info_icons/element.png",
      unlocked: true,
      date: new Date("2025-04-01")
    },
    {
      name: "Level 2",
      description: "Complete level 2",
      image: "actor_info_icons/element.png",
      unlocked: false
    }
  ];
  getSettings = () => [
    {
      toolbarHeight: 50
    }
  ];
}
