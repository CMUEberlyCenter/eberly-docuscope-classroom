import { Component, OnInit } from '@angular/core';

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

  constructor(private assignmentService: AssignmentService) {
    assignmentService.course$.subscribe(c => this.course = c);
    assignmentService.assignment$.subscribe(c => this.assignment = c);
    assignmentService.instructor$.subscribe(c => this.instructor = c);
  }

  ngOnInit() {
  }

}
