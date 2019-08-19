import { Component, Input, OnInit } from '@angular/core';
import { AssignmentData } from '../boxplot-data';

@Component({
  selector: 'app-assignment-bar',
  templateUrl: './assignment-bar.component.html',
  styleUrls: ['./assignment-bar.component.css']
})
export class AssignmentBarComponent implements OnInit {
  @Input() assignment: AssignmentData;

  constructor() { }

  ngOnInit() {
  }

}
