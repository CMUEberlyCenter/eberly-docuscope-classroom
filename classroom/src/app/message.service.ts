import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  messages: string[] = [];
  debug = true;
  debug_msg = false;

  add(message: string): void {
    if (this.debug) {
      console.log(message);
    }
    this.messages.push(message);
  }

  clear(): void {
    this.messages = [];
  }
}
