import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Type } from '@angular/core';

import { AssignmentService } from './assignment.service';
import { AssignmentData } from './assignment-data';

describe('AssignmentService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule],
      providers: [ AssignmentService ]
    });

    httpMock = TestBed.get(HttpTestingController as Type<HttpTestingController>);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    const service: AssignmentService = TestBed.get(AssignmentService);
    expect(service).toBeTruthy();
  });

  it('should get assignment data', () => {
    const service: AssignmentService = TestBed.get(AssignmentService);
    const stubAssignment: AssignmentData = {
      course: 'course_stub',
      assignment: 'assignment_stub',
      intro: 'intro_stub',
      stv_intro: 'stv_intro_stub'
    };
    service.getAssignment('stub').subscribe(assignment => {
      expect(assignment).toEqual(stubAssignment);
    });

    const req = httpMock.expectOne(`${service.assignments_base_url}stub.json`);
    expect(req.request.method).toBe('GET');
    req.flush(stubAssignment);
  });

  it('getAssignment error', () => {
    const service: AssignmentService = TestBed.get(AssignmentService);
    service.getAssignment('error').subscribe(assignment => {
      expect(assignment.course).toBe('Course Name');
    });
    const req = httpMock.expectOne(`${service.assignments_base_url}error.json`);
    req.error(new ErrorEvent('network error'));
  });
});
