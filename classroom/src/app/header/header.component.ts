import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { AboutComponent } from '../about/about.component';
import { AssignmentService } from '../assignment.service';
import { AssignmentData } from '../assignment-data';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  title = 'DocuScope Classroom @ CMU';
  course: string;
  assignment: string;
  instructor: string;

  constructor(private about: MatDialog,
    private assignmentService: AssignmentService) {
    assignmentService.course$.subscribe(c => this.course = c);
    assignmentService.assignment$.subscribe(c => this.assignment = c);
    assignmentService.instructor$.subscribe(c => this.instructor = c);
  }

  ngOnInit() {
  }

  openAbout(): void {
    this.about.open(AboutComponent);
  }
}
