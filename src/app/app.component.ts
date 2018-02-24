import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {StompService} from './stomp-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {

  @ViewChild('messageArea') messageArea: ElementRef;

  connected = false;
  connecting = false;

  username: string;
  messageContent: string;
  messages: Message[] = [];

  private colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652', '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
  ];

  constructor(private stompClient: StompService) {
    stompClient.configure({
      host: '/ws',
      debug: true,
      queue: {'init': false}
    });
  }

  connect(event: any) {
    if (this.username) {
      this.stompClient.startConnect().then(
        () => this.onConnected(),
        (reason) => {
          console.log(reason);
        });
      this.connecting = true;
    }
    event.preventDefault();
  }

  onConnected() {
    console.log('Stomp client connected');
    this.connected = true;
    this.connecting = false;

    // Subscribe to the Public Topic
    this.stompClient.subscribe('/topic/public', (message) => {
      this.onMessageReceived(message);
    });

    // Tell your username to the server
    const joinMessage = {
      sender: this.username,
      content: null,
      type: 'JOIN'
    };
    this.stompClient.send('/app/chat.addUser', joinMessage);
  }

  ngOnDestroy() {
    if (this.connected) {
      this.stompClient.disconnect().then(() => {
        console.log('Stomp client disconnected');
      });
    }
  }

  sendMessage(event) {
    if (this.messageContent && this.stompClient) {
      const chatMessage = {
        sender: this.username,
        content: this.messageContent,
        type: 'CHAT'
      };
      this.stompClient.send('/app/chat.sendMessage', chatMessage);
      this.messageContent = '';
    }
    event.preventDefault();
  }

  onMessageReceived(message: Message) {
    if (message.type === 'JOIN') {
      message.messageClass = 'event-message';
      message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
      message.messageClass = 'event-message';
      message.content = message.sender + ' left!';
    } else {
      message.messageClass = 'chat-message';
    }
    this.messages.push(message);

    this.messageArea.nativeElement.scrollTop = this.messageArea.nativeElement.scrollHeight;
  }

  getAvatarColor(messageSender: string): string {
    let hash = 0;
    for (let i = 0; i < messageSender.length; i++) {
      hash = 31 * hash + messageSender.charCodeAt(i);
    }

    const index = Math.abs(hash % this.colors.length);
    return this.colors[index];
  }
}

export interface Message {
  type: string;
  sender: string;
  content: string;
  messageClass: string;
}
