import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { AboutComponent } from './about/about.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: []
})
export class AppComponent {
  title = 'DocuScope Classroom @ CMU';

  constructor(public about: MatDialog) { }

  openAbout(): void {
    this.about.open(AboutComponent);
  }
}
