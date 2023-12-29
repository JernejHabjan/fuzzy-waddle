import { Component } from "@angular/core";
import { faWindowMaximize, faWindowMinimize } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "fuzzy-waddle-chat-float",
  templateUrl: "./chat-float.component.html",
  styleUrls: ["./chat-float.component.scss"]
})
export class ChatFloatComponent {
  faWindowMinimize = faWindowMinimize;
  faWindowMaximize = faWindowMaximize;

  maximized = false;

  toggleChatVisibility() {
    this.maximized = !this.maximized;
  }
}
