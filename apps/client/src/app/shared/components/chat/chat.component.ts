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
import { ChatReportReason, type ChatMessage } from "@fuzzy-waddle/api-interfaces";
import { AvatarProviderService } from "./avatar-provider/avatar-provider.service";
import { Observable, Subscription, Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";

import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../auth/auth.service";
import { AngularHost } from "../../consts";
import { ChatService } from "../../../data-access/chat/chat.service";

const DEFAULT_PAGE_SIZE = 10;
const SCROLL_THRESHOLD = 50;

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
  readonly gameInstanceId = input<string | null | undefined>(undefined);
  readonly newMessage = output<ChatMessage>();

  protected message = "";
  protected readonly messages: ChatMessage[] = [];
  protected isLoading = false;
  protected hasMoreMessages = true;
  protected reportingMessageId: number | null = null;
  protected reportReason: ChatReportReason = ChatReportReason.Abuse;
  protected reportDetails = "";
  protected reportStatusMessage = "";
  protected reportErrorMessage = "";
  protected readonly reportReasons = Object.values(ChatReportReason);
  protected readonly reportReasonLabels: Record<ChatReportReason, string> = {
    [ChatReportReason.Spam]: "Spam",
    [ChatReportReason.Abuse]: "Abuse",
    [ChatReportReason.Harassment]: "Harassment",
    [ChatReportReason.HateSpeech]: "Hate speech",
    [ChatReportReason.Cheating]: "Cheating",
    [ChatReportReason.PersonalInformation]: "Personal information",
    [ChatReportReason.Other]: "Other"
  };
  private messageSubscription?: Subscription;
  private scrollSubscription?: Subscription;
  private offset = 0;

  private scrollSubject = new Subject<void>();

  protected readonly avatarProviderService = inject(AvatarProviderService);
  protected readonly authService = inject(AuthService);
  private readonly chatService = inject(ChatService);

  async ngOnInit(): Promise<void> {
    // Fetch previous messages
    await this.loadPreviousMessages();
    this.scrollToBottomForce();

    this.messageSubscription = this.messageListener()?.subscribe((msg: ChatMessage) => {
      this.messages.push(msg);
      this.scrollToBottom();
    });

    // Set up debounced scroll handler
    this.scrollSubscription = this.scrollSubject.pipe(debounceTime(200)).subscribe(() => {
      this.onScrollDebounced();
    });

    // this.newMessage?.emit(this.createMessage("Joined the chat"));
  }

  private async loadPreviousMessages(): Promise<void> {
    if (this.isLoading || !this.hasMoreMessages) return;

    this.isLoading = true;
    try {
      const response = await this.chatService.getMessages(
        DEFAULT_PAGE_SIZE,
        this.offset,
        this.gameInstanceId() ?? undefined
      );
      if (response.messages.length > 0) {
        // Prepend older messages to the beginning
        this.messages.unshift(...response.messages);
        this.offset += response.messages.length;
      }
      this.hasMoreMessages = response.hasMore;
    } catch (error) {
      console.error("Failed to load previous messages:", error);
    } finally {
      this.isLoading = false;
    }
  }

  protected onScroll(): void {
    this.scrollSubject.next();
  }

  private async onScrollDebounced(): Promise<void> {
    const chatBody = this.chatBody();
    if (chatBody && chatBody.nativeElement.scrollTop <= SCROLL_THRESHOLD) {
      const previousScrollHeight = chatBody.nativeElement.scrollHeight;
      await this.loadPreviousMessages();
      // Maintain scroll position after prepending messages
      setTimeout(() => {
        const newScrollHeight = chatBody.nativeElement.scrollHeight;
        chatBody.nativeElement.scrollTop = newScrollHeight - previousScrollHeight;
      }, 0);
    }
  }

  private scrollToBottomForce() {
    setTimeout(() => {
      const chatBody = this.chatBody();
      if (chatBody) {
        chatBody.nativeElement.scrollTop = chatBody.nativeElement.scrollHeight;
      }
    }, 0);
  }

  private scrollToBottom() {
    const chatBody = this.chatBody();
    if (chatBody) {
      // scroll to bottom only if we are already at the bottom, otherwise stick to the current position
      const scrollBottom = chatBody.nativeElement.scrollTop + chatBody.nativeElement.clientHeight;
      setTimeout(() => {
        if (
          scrollBottom + 1 >=
          this.chatBody().nativeElement.scrollHeight - this.chatBody().nativeElement.clientHeight
        ) {
          this.chatBody().nativeElement.scrollTop = this.chatBody().nativeElement.scrollHeight;
        }
      }, 0);
    }
  }

  protected sendMessage() {
    if (!this.message) {
      return;
    }
    this.newMessage?.emit(this.createMessage(this.message));
    this.message = "";
  }

  protected openReportForm(message: ChatMessage): void {
    if (!message.id || message.userId === this.authService.userId) {
      return;
    }

    this.reportingMessageId = message.id;
    this.reportReason = ChatReportReason.Abuse;
    this.reportDetails = "";
    this.reportStatusMessage = "";
    this.reportErrorMessage = "";
  }

  protected cancelReport(): void {
    this.reportingMessageId = null;
    this.reportDetails = "";
    this.reportStatusMessage = "";
    this.reportErrorMessage = "";
  }

  protected async submitReport(message: ChatMessage): Promise<void> {
    if (!message.id) {
      return;
    }

    this.reportStatusMessage = "";
    this.reportErrorMessage = "";

    try {
      await this.chatService.reportMessage(message.id, {
        reason: this.reportReason,
        details: this.reportDetails.trim() || undefined
      });
      this.reportStatusMessage = "Report submitted.";
      this.reportingMessageId = null;
      this.reportDetails = "";
    } catch (error) {
      console.error("Failed to report chat message:", error);
      this.reportErrorMessage = "Could not submit report.";
    }
  }

  @HostListener("window:beforeunload")
  async onBeforeUnload() {
    this.ngOnDestroy();
  }

  ngOnDestroy(): void {
    // this.newMessage?.emit(this.createMessage("Left the chat"));
    this.messageSubscription?.unsubscribe();
    this.scrollSubscription?.unsubscribe();
    this.scrollSubject.complete();
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
