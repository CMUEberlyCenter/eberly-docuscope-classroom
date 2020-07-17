/* Component for displaying the "About" page content. */
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  title = 'DocuScope Classroom';
  institution = 'CMU';
  homepage = 'https://www.cmu.edu/dietrich/english/research/docuscope.html';

  constructor(
    public dialogRef: MatDialogRef<AboutComponent>,
    private _settings_service: SettingsService
  ) { }

  getSettings(): void {
    this._settings_service.getSettings().subscribe(settings => {
      this.title = settings.title;
      this.institution = settings.institution;
      this.homepage = settings.homepage;
    });
  }

  ngOnInit() {
    this.getSettings();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
