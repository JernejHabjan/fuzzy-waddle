import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LobbyModule } from "../lobby/lobby.module";

@Component({
  selector: "fuzzy-waddle-lobby-page",
  standalone: true,
  imports: [CommonModule, LobbyModule],
  templateUrl: "./lobby-page.component.html",
  styleUrls: ["./lobby-page.component.scss"]
})
export class LobbyPageComponent {}
