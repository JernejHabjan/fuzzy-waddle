import { Component, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../../../data-access/chat/chat.service';
import { ChatMessage } from '@fuzzy-waddle/api-interfaces';

@Component({
  selector: 'fuzzy-waddle-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {

  @ViewChild('chatBody') chatBody!: ElementRef;
  message = '';
  messages: ChatMessage[] = [];
  constructor(public chatService: ChatService) {
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
}
