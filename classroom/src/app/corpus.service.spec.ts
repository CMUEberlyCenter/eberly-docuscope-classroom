import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { asyncData } from '../testing';

import { CorpusService } from './corpus.service';
import { AssignmentService } from './assignment.service';

describe('CorpusService', () => {
  const activatedRoute_spy = jasmine.createSpyObj('ActivatedRoute', ['paramMap']);
  activatedRoute_spy.snapshot = jasmine.createSpyObj('snapshot', ['paramMap']);
  activatedRoute_spy.snapshot.queryParamMap = jasmine.createSpyObj('queryParamMap', ['get']);
  activatedRoute_spy.snapshot.queryParamMap.get.and.returnValue('1,2,3');
  const assignment_spy = jasmine.createSpyObj('AssignmentService', ['getAssignment']);
  assignment_spy.getAssignment.and.returnValue(asyncData({
    course: 'stub',
    assignment: 'stub',
    intro: 'stub',
    stv_intro: 'stub'
  }));
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      { provide: ActivatedRoute, useValue: activatedRoute_spy },
      { provide: AssignmentService, useValue: assignment_spy }
    ]
  }));

  it('should be created', () => {
    const service: CorpusService = TestBed.get(CorpusService);
    expect(service).toBeTruthy();
  });
});
