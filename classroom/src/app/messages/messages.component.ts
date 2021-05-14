/* Component for displaying system messages to user.
  FIXME: should be removed in favor of using snackbar or other
  modal as this is not quite meeting user's needs.
*/
import { Component } from '@angular/core';
import { MessageService } from '../message.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
})
export class MessagesComponent {
  constructor(public messageService: MessageService) {}
}
