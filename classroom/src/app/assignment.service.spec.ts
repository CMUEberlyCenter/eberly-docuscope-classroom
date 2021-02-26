import { TestBed } from '@angular/core/testing';
import { AssignmentData } from './assignment-data';
import { AssignmentService } from './assignment.service';

describe('AssignmentService', () => {
  let service: AssignmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ ],
      providers: [ AssignmentService ]
    });
    service = TestBed.inject(AssignmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setAssignment', () => {
    const data = 'Set Assignment';
    service.assignment$.subscribe(assign => expect(assign).toEqual(data));
    service.setAssignment(data);
  });

  it('setCourse', () => {
    const data = 'Set Course';
    service.course$.subscribe(course => expect(course).toEqual(data));
    service.setCourse(data);
  });

  it('setInstructor', () => {
    const data = 'Testy Tester';
    service.instructor$.subscribe(inst => expect(inst).toEqual(data));
    service.setInstructor(data);
  });

  it('setAssignmentData', () => {
    const stub: AssignmentData = {
      course: 'course_stub',
      assignment: 'assignment_stub',
      instructor: 'Testy Tester'
    };
    service.assignment$.subscribe(
      assign => expect(assign).toEqual(stub.assignment));
    service.course$.subscribe(course => expect(course).toEqual(stub.course));
    service.instructor$.subscribe(
      inst => expect(inst).toEqual(stub.instructor));
    service.setAssignmentData(stub);
  });
});
