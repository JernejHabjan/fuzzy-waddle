import { Injectable } from "@angular/core";
import { UserInstanceServiceInterface } from "./user-instance.service.interface";

export interface GamesVisited {
  name: string;
  count: number;
}

@Injectable({
  providedIn: "root"
})
export class UserInstanceService implements UserInstanceServiceInterface {
  getPageTheme = () => "light";
  private readonly gamesVisitedKey = "games-visited";

  private getGamesVisited(): GamesVisited[] {
    // get it from local storage
    const gamesVisited = localStorage.getItem(this.gamesVisitedKey);
    if (gamesVisited === null) {
      return [];
    }
    try {
      return JSON.parse(gamesVisited) as GamesVisited[];
    } catch (e) {
      return [];
    }
  }

  private saveGamesVisited(gamesVisited: GamesVisited[]): void {
    // save it to local storage
    localStorage.setItem(this.gamesVisitedKey, JSON.stringify(gamesVisited));
  }

  getPreferredGame(): string | null {
    // get it from local storage
    const gamesVisited = this.getGamesVisited();
    if (gamesVisited.length === 0) {
      return null;
    }
    const preferredGame = gamesVisited.sort((a, b) => b.count - a.count)[0];
    return preferredGame.name;
  }

  setVisitedGame(game: "aota" | "little-muncher" | "fly-squasher"): void {
    const gamesVisited = this.getGamesVisited();
    const existingGame = gamesVisited.find((g) => g.name === game);

    if (existingGame) {
      // Increment the count if the game is already in the list
      existingGame.count++;
    } else {
      // Add the game to the list if not present
      gamesVisited.push({ name: game, count: 1 });
    }

    // Save the updated gamesVisited array
    this.saveGamesVisited(gamesVisited);
  }
}
