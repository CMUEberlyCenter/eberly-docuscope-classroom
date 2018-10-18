import { Component } from '@angular/core';
import { AppSettingsService } from './app-settings.service';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: []
})
export class AppComponent {
  title = 'DocuScope Classroom @ CMU';

  constructor(private modalService: ModalService) { }
  openModal(id: string) { this.modalService.open(id); }
  closeModal(id: string) { this.modalService.close(id); }
}
