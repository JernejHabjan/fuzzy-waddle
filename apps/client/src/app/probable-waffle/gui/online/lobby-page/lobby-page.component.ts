import { Component } from "@angular/core";

import { LobbyComponent } from "../../lobby/lobby.component";

@Component({
  selector: "fuzzy-waddle-lobby-page",
  standalone: true,
  imports: [LobbyComponent],
  templateUrl: "./lobby-page.component.html",
  styleUrls: ["./lobby-page.component.scss"]
})
export class LobbyPageComponent {}
