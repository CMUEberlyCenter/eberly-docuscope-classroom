import { Component, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

import { ModalService } from '../modal.service';
import { Modal } from '../modal';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements Modal, OnInit, OnDestroy {
  @Input() id: string;
  private element: any;

  constructor(private modalService: ModalService, private el: ElementRef) {
    this.element = el.nativeElement;
  }

  ngOnInit() {
    const modal = this;
    if (!this.id) {
      console.error('modal must have an id!');
      return;
    }
    // move element to bottom of page so it has the highest z-index
    document.body.appendChild(this.element);
    // close on background click
    this.element.addEventListener('click', $event => {
      if ($event.target.className === 'app-modal') { modal.close(); }
    });
    this.modalService.add(this);
  }
  ngOnDestroy(): void {
    this.modalService.remove(this.id);
    this.element.remove();
  }
  open(): void {
    this.element.style.display = 'block';
    document.body.classList.add('jw-modal-open');
  }
  close(): void {
    this.element.style.display = 'none';
    document.body.classList.remove('jw-modal-open');
  }
}
