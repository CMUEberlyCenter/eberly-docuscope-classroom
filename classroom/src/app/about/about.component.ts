/* Component for displaying the "About" page content.

This component is meant to display information about
the purpose of this application, the developers, and
funding.  Most of the information is in the HTML template
with some minor customization available from
assets/settings.json
*/
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
})
export class AboutComponent implements OnInit {
  title = 'DocuScope Classroom'; // For the Title text
  institution = 'CMU'; // the @ {{institution}} text
  homepage = 'https://www.cmu.edu/dietrich/english/research/docuscope.html';

  constructor(
    public dialogRef: MatDialogRef<AboutComponent>,
    private _settings_service: SettingsService
  ) { }

  /** Retrieve the settings file and pull out the appropriate information. */
  getSettings(): void {
    this._settings_service.getSettings().subscribe((settings) => {
      this.title = settings.title;
      this.institution = settings.institution;
      this.homepage = settings.homepage;
    });
  }

  /** On component initialization, get the settings. */
  ngOnInit(): void {
    this.getSettings();
  }

  /** Event handler for the close dialog button. */
  onNoClick(): void {
    this.dialogRef.close();
  }
}
