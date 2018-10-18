import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  messages: string[] = [];
  debug: boolean = true;

  constructor() { }

  add(message: string) {
    if (this.debug) console.log(message)
    this.messages.push(message);
  }

  clear() {
    this.messages = [];
  }
}
