import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class UserInstanceService {
  getPageTheme = () => "light";
  getPreferredGames = () => ["probable-waffle"];
}
