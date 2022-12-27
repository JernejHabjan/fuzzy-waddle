import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameInstanceService {
  getPlayerProgress = () => ['level1'];
  getAchievements = () => ['achievement1'];
  getSettings = () => [
    {
      toolbarHeight: 50
    }
  ];
}
