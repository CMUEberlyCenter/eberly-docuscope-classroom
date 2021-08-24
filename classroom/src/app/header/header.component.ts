/* Component for the application header */
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AboutComponent } from '../about/about.component';
import { AssignmentService } from '../assignment.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  title = 'DocuScope Classroom';
  institution = '@ CMU';
  course = '';
  assignment = '';
  instructor = '';

  constructor(
    private about: MatDialog,
    private assignmentService: AssignmentService,
    private settingsService: SettingsService
  ) {
    this.assignmentService.course$.subscribe((c) => (this.course = c));
    this.assignmentService.assignment$.subscribe((c) => (this.assignment = c));
    this.assignmentService.instructor$.subscribe((c) => (this.instructor = c));
  }

  /** Retrieve the application settings.json */
  getSettings(): void {
    this.settingsService.getSettings().subscribe((settings) => {
      this.title = settings.title;
      if (settings.institution) {
        this.institution = `@ ${settings.institution}`;
      } else {
        this.institution = '';
      }
    });
  }

  ngOnInit(): void {
    this.getSettings();
  }

  /** Open the about modal. */
  openAbout(): void {
    this.about.open(AboutComponent);
  }
}
