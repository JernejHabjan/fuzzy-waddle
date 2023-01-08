import { Injectable } from '@angular/core';

export type Achievement = {
  name: string;
  description: string;
  image: string;
  unlocked: boolean;
};
@Injectable({
  providedIn: 'root'
})
export class GameInstanceService {
  getPlayerProgress = () => ['level1'];
  getAchievements = (): Achievement[] => [
    {
      name: 'Level 1',
      description: 'Complete level 1',
      image: 'https://cdn4.iconfinder.com/data/icons/flat-design-security-set-one/24/security-level-1-512.png',
      unlocked: true
    },
    {
      name: 'Level 2',
      description: 'Complete level 2',
      image: 'https://cdn-icons-png.flaticon.com/512/3640/3640595.png',
      unlocked: false
    }
  ];
  getSettings = () => [
    {
      toolbarHeight: 50
    }
  ];
}
