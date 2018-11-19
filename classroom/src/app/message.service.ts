import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  messages: string[] = [];
  debug: boolean = true;
  debug_msg: boolean = false;

  constructor() { }

  add(message: string) {
    if (this.debug) {
      console.log(message)
      if (this.debug_msg)
        this.messages.push(message);
    }
  }

  clear() {
    this.messages = [];
  }
}
