import { Component, inject } from "@angular/core";
import { faWindowMaximize, faWindowMinimize } from "@fortawesome/free-solid-svg-icons";
import { ChatService } from "../../../data-access/chat/chat.service";
import { CommonModule } from "@angular/common";
import { ChatComponent } from "../../../shared/components/chat/chat.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@Component({
  selector: "fuzzy-waddle-chat-float",
  templateUrl: "./chat-float.component.html",
  styleUrls: ["./chat-float.component.scss"],
  standalone: true,
  imports: [CommonModule, ChatComponent, FaIconComponent]
})
export class ChatFloatComponent {
  protected readonly faWindowMinimize = faWindowMinimize;
  protected readonly faWindowMaximize = faWindowMaximize;
  protected readonly chatService = inject(ChatService);

  protected maximized = false;

  protected toggleChatVisibility() {
    this.maximized = !this.maximized;
  }
}
