import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ChatService } from "../../../data-access/chat/chat.service";
import { ChatMessage } from "@fuzzy-waddle/api-interfaces";
import { AvatarProviderService } from "./avatar-provider/avatar-provider.service";
import { Subscription } from "rxjs";

@Component({
  selector: "fuzzy-waddle-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"]
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild("chatBody") chatBody!: ElementRef;
  message = "";
  messages: ChatMessage[] = [];
  private messageSubscription?: Subscription;

  constructor(
    private chatService: ChatService,
    protected avatarProviderService: AvatarProviderService
  ) {}

  ngOnInit(): void {
    this.messageSubscription = this.chatService.getMessage()?.subscribe((msg: ChatMessage) => {
      this.messages.push(msg);
      // scroll to bottom
      setTimeout(() => {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }, 0);
    });

    this.chatService.sendMessage(this.chatService.createMessage("Joined the chat"));
  }

  sendMessage() {
    if (!this.message) {
      return;
    }
    this.chatService.sendMessage(this.chatService.createMessage(this.message));
    this.message = "";
  }

  ngOnDestroy(): void {
    this.chatService.sendMessage(this.chatService.createMessage("Left the chat"));
    this.messageSubscription?.unsubscribe();
  }
}
