import { Component, inject, type OnDestroy, type OnInit } from "@angular/core";
import { ProbableWaffleCommunicatorService } from "../../../communicators/probable-waffle-communicator.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { type ChatMessage } from "@fuzzy-waddle/platform-chat";
import { ProbableWaffleGameInstanceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { Subject, Subscription } from "rxjs";
import { ChatComponent } from "@fuzzy-waddle/platform-chat/client/components/chat.component";
import { OptionsService } from "../../options/options.service";

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
  private readonly optionsService = inject(OptionsService);

  private messagesSubscription: Subscription | undefined;
  protected listenToMessages: Subject<ChatMessage> = new Subject<ChatMessage>();

  ngOnInit(): void {
    this.messagesSubscription = this.communicatorService.message?.on.subscribe((msg) => {
      this.listenToMessages.next(this.optionsService.presentChatMessage(msg.chatMessage));
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
