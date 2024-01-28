import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LobbyComponent } from "../../lobby/lobby.component";

@Component({
  selector: "fuzzy-waddle-lobby-page",
  standalone: true,
  imports: [CommonModule, LobbyComponent],
  templateUrl: "./lobby-page.component.html",
  styleUrls: ["./lobby-page.component.scss"]
})
export class LobbyPageComponent {}
