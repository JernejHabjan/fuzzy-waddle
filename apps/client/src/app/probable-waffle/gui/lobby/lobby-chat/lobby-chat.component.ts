import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { ProbableWaffleCommunicatorService } from "../../../communicators/probable-waffle-communicator.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { AuthService } from "../../../../auth/auth.service";
import { ChatMessage, ProbableWaffleGameInstanceType } from "@fuzzy-waddle/api-interfaces";
import { Subject, Subscription } from "rxjs";
import { ChatComponent } from "../../../../shared/components/chat/chat.component";

@Component({
  selector: "probable-waffle-lobby-chat",
  imports: [ChatComponent],
  templateUrl: "./lobby-chat.component.html",
  styleUrls: ["./lobby-chat.component.scss"]
})
export class LobbyChatComponent implements OnInit, OnDestroy {
  private readonly communicatorService = inject(ProbableWaffleCommunicatorService);
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly authService = inject(AuthService);

  private messagesSubscription: Subscription | undefined;
  protected listenToMessages: Subject<ChatMessage> = new Subject<ChatMessage>();

  ngOnInit(): void {
    this.messagesSubscription = this.communicatorService.message?.on.subscribe((msg) => {
      this.listenToMessages.next(msg.chatMessage);
    });
  }

  protected sendMessage(chatMessage: ChatMessage) {
    this.communicatorService.message?.send({
      chatMessage,
      gameInstanceId: this.gameInstanceClientService.currentGameInstanceId!,
      emitterUserId: this.authService.userId
    });
  }

  ngOnDestroy(): void {
    this.messagesSubscription?.unsubscribe();
  }

  protected readonly ProbableWaffleGameInstanceType = ProbableWaffleGameInstanceType;
}
