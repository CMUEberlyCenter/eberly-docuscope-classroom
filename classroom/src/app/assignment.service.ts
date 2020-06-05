/*
Service for passing descriptive information about the assignment:
- Assignment name
- Course name
- Instructor name

Need a service as the relevant information is packed into various other request
responses and needs to be passed to the header.
*/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AssignmentData } from './assignment-data';

/**
 * Service for passing descriptive assignment information around.
 */
@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  /** Storage for current assignment data */
  private assignment = new Subject<string>();
  private course = new Subject<string>();
  private instructor = new Subject<string>();

  /** Observables on assgnment data */
  assignment$ = this.assignment.asObservable();
  course$ = this.course.asObservable();
  instructor$ = this.instructor.asObservable();

  constructor() { }

  /**
   * Set the current assignment name.
   */
  setAssignment(assignment: string): void {
    this.assignment.next(assignment);
  }
  /**
   * Set the current course name.
   */
  setCourse(course: string): void {
    this.course.next(course);
  }
  /**
   * Set the current instructor name.
   */
  setInstructor(instructor: string): void {
    this.instructor.next(instructor);
  }
  /**
   * Set all of the descriptive assignment information based on AssignmentData.
   * The results that have descriptive assignment data are AssignmentData
   * instances.
   */
  setAssignmentData(assignment: AssignmentData): void {
    this.setAssignment(assignment.assignment);
    this.setCourse(assignment.course);
    this.setInstructor(assignment.instructor);
  }
}
