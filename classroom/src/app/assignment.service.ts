import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
// import { MessageService } from './message.service';
import { AssignmentData } from './assignment-data';

const DefaultAssignmentData: AssignmentData = {
  course: 'Course Name',
  assignment: 'Assignment',
};

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private course = new Subject<string>();
  private assignment = new Subject<string>();
  private instructor = new Subject<string>();

  course$ = this.course.asObservable();
  assignment$ = this.assignment.asObservable();
  instructor$ = this.instructor.asObservable();

  constructor() { }

  setCourse(course: string): void {
    this.course.next(course);
  }
  setAssignment(assignment: string): void {
    this.assignment.next(assignment);
  }
  setInstructor(instructor: string): void {
    this.instructor.next(instructor);
  }
  setAssignmentData(assignment: AssignmentData): void {
    this.setCourse(assignment.course);
    this.setAssignment(assignment.assignment);
    this.setInstructor(assignment.instructor);
  }
}
