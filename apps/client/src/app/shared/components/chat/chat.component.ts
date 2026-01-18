import {
  Component,
  ElementRef,
  HostListener,
  inject,
  type OnDestroy,
  type OnInit,
  input,
  output,
  viewChild
} from "@angular/core";
import type { ChatMessage } from "@fuzzy-waddle/api-interfaces";
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
  readonly chatBody = viewChild.required<ElementRef>("chatBody");

  readonly messageListener = input.required<Observable<ChatMessage> | undefined>();
  readonly loadPreviousMessages = input<(() => Promise<ChatMessage[]>) | undefined>(undefined);
  readonly newMessage = output<ChatMessage>();

  protected message = "";
  protected readonly messages: ChatMessage[] = [];
  private messageSubscription?: Subscription;

  protected readonly avatarProviderService = inject(AvatarProviderService);
  protected readonly authService = inject(AuthService);

  async ngOnInit(): Promise<void> {
    // Load previous messages if the function is provided
    const loadFn = this.loadPreviousMessages();
    if (loadFn) {
      try {
        const previousMessages = await loadFn();
        this.messages.push(...previousMessages);
        setTimeout(() => this.scrollToBottomForce(), 0);
      } catch (error) {
        console.error("Failed to load previous messages:", error);
      }
    }

    this.messageSubscription = this.messageListener()?.subscribe((msg: ChatMessage) => {
      this.messages.push(msg);
      this.scrollToBottom();
    });

    this.newMessage?.emit(this.createMessage("Joined the chat"));
  }

  private scrollToBottom() {
    const chatBody = this.chatBody();
    if (chatBody) {
      // scroll to bottom only if we are already at the bottom, otherwise stick to the current position
      const scrollBottom = chatBody.nativeElement.scrollTop + chatBody.nativeElement.clientHeight;
      setTimeout(() => {
        if (scrollBottom + 1 >= this.chatBody().nativeElement.scrollHeight - this.chatBody().nativeElement.clientHeight) {
          this.chatBody().nativeElement.scrollTop = this.chatBody().nativeElement.scrollHeight;
        }
      }, 0);
    }
  }

  private scrollToBottomForce() {
    const chatBody = this.chatBody();
    if (chatBody) {
      chatBody.nativeElement.scrollTop = chatBody.nativeElement.scrollHeight;
    }
  }

  protected sendMessage() {
    if (!this.message) {
      return;
    }
    this.newMessage?.emit(this.createMessage(this.message));
    this.message = "";
  }

  @HostListener("window:beforeunload")
  async onBeforeUnload() {
    this.ngOnDestroy();
  }

  ngOnDestroy(): void {
    this.newMessage?.emit(this.createMessage("Left the chat"));
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
