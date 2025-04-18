import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from "@angular/core";
import { ChatMessage } from "@fuzzy-waddle/api-interfaces";
import { AvatarProviderService } from "./avatar-provider/avatar-provider.service";
import { Observable, Subscription } from "rxjs";

import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../auth/auth.service";
import { AngularHost } from "../../consts";

@Component({
  selector: "fuzzy-waddle-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
  imports: [FormsModule],
  host: AngularHost.contentFlexFullHeight
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild("chatBody") chatBody!: ElementRef;

  @Input({ required: true }) messageListener: Observable<ChatMessage> | undefined;
  @Output() newMessage: EventEmitter<ChatMessage> = new EventEmitter<ChatMessage>();

  protected message = "";
  protected readonly messages: ChatMessage[] = [];
  private messageSubscription?: Subscription;

  protected readonly avatarProviderService = inject(AvatarProviderService);
  protected readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.messageSubscription = this.messageListener?.subscribe((msg: ChatMessage) => {
      this.messages.push(msg);
      this.scrollToBottom();
    });

    this.newMessage?.next(this.createMessage("Joined the chat"));
  }

  private scrollToBottom() {
    if (this.chatBody) {
      // scroll to bottom only if we are already at the bottom, otherwise stick to the current position
      const scrollBottom = this.chatBody.nativeElement.scrollTop + this.chatBody.nativeElement.clientHeight;
      setTimeout(() => {
        if (scrollBottom + 1 >= this.chatBody.nativeElement.scrollHeight - this.chatBody.nativeElement.clientHeight) {
          this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
        }
      }, 0);
    }
  }

  protected sendMessage() {
    if (!this.message) {
      return;
    }
    this.newMessage?.next(this.createMessage(this.message));
    this.message = "";
  }

  @HostListener("window:beforeunload")
  async onBeforeUnload() {
    this.ngOnDestroy();
  }

  ngOnDestroy(): void {
    this.newMessage?.next(this.createMessage("Left the chat"));
    this.messageSubscription?.unsubscribe();
  }

  createMessage(message: string): ChatMessage {
    return {
      text: message,
      userId: this.authService.userId as string,
      fullName: this.authService.fullName as string,
      createdAt: new Date()
    };
  }
}
