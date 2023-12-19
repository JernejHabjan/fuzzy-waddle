import { Component } from "@angular/core";
import { DEPRECATED_gameInstanceService } from "../../communicators/DEPRECATED_game-instance.service";

@Component({
  selector: "fuzzy-waddle-probable-waffle",
  templateUrl: "./probable-waffle.component.html",
  styleUrls: ["./probable-waffle.component.scss"]
})
export class ProbableWaffleComponent {
  constructor(private dEPRECATED_gameInstanceService: DEPRECATED_gameInstanceService) {}
}
