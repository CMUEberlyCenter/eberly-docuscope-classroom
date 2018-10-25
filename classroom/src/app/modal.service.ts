/**
 * http://jasonwatmore.com/post/2018/05/25/angular-6-custom-modal-window-dialog-box
 */
import { Injectable } from '@angular/core';

import { Modal } from './modal';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modals: Map<string, Modal> = new Map<string, Modal>();

  constructor() { }

  add(modal: Modal) {
    this.modals.set(modal.id, modal);
  }

  remove(id: string) {
    this.modals.delete(id);
  }

  open(id: string) {
    let modal: Modal = this.modals.get(id);
    modal.open();
  }

  close(id: string) {
    let modal: Modal = this.modals.get(id);
    modal.close();
  }
}
