import { TestBed } from '@angular/core/testing';
import { AssignmentData } from './assignment-data';
import { AssignmentService } from './assignment.service';

describe('AssignmentService', () => {
  let service: AssignmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [AssignmentService],
    });
    service = TestBed.inject(AssignmentService);
  });

  it('should be created', () => {
    void expect(service).toBeTruthy();
  });

  it('setAssignment', () => {
    const data = 'Set Assignment';
    service.assignment$.subscribe(
      (assign) => void expect(assign).toEqual(data)
    );
    service.setAssignment(data);
  });

  it('setCourse', () => {
    const data = 'Set Course';
    service.course$.subscribe((course) => void expect(course).toEqual(data));
    service.setCourse(data);
  });

  it('setInstructor', () => {
    const data = 'Testy Tester';
    service.instructor$.subscribe((inst) => void expect(inst).toEqual(data));
    service.setInstructor(data);
  });

  it('setAssignmentData', () => {
    const stub: AssignmentData = {
      course: 'course_stub',
      assignment: 'assignment_stub',
      instructor: 'Testy Tester',
    };
    service.assignment$.subscribe(
      (assign) => void expect(assign).toEqual('assignment_stub')
    );
    service.course$.subscribe(
      (course) => void expect(course).toEqual('course_stub')
    );
    service.instructor$.subscribe(
      (inst) => void expect(inst).toEqual('Testy Tester')
    );
    service.setAssignmentData(stub);
  });
});
