import { Component, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../../../data-access/chat/chat.service';
import { ChatMessage } from '@fuzzy-waddle/api-interfaces';
import { createAvatar } from '@dicebear/core';
import * as pixelArt from '@dicebear/pixel-art';

@Component({
  selector: 'fuzzy-waddle-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {
  @ViewChild('chatBody') chatBody!: ElementRef;
  message = '';
  messages: ChatMessage[] = [];

  constructor(private chatService: ChatService) {
    chatService.getMessage().subscribe((msg: ChatMessage) => {
      this.messages.push(msg);
      // scroll to bottom
      setTimeout(() => {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }, 0);
    });

    chatService.sendMessage(chatService.createMessage('Joined the chat'));
  }

  sendMessage() {
    if (!this.message) {
      return;
    }
    this.chatService.sendMessage(this.chatService.createMessage(this.message));
    this.message = '';
  }

  getAvatar(userId: string) {
    const avatar = createAvatar(pixelArt, { seed: userId });
    return avatar.toDataUriSync();
  }
}
