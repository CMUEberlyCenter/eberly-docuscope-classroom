import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { asyncData } from '../testing';

import { CorpusService } from './corpus.service';
import { AssignmentService } from './assignment.service';

describe('CorpusService', () => {
  let service: CorpusService;
  const activatedRoute_spy = jasmine.createSpyObj('ActivatedRoute', ['paramMap']);
  activatedRoute_spy.snapshot = jasmine.createSpyObj('snapshot', ['paramMap']);
  activatedRoute_spy.snapshot.queryParamMap = jasmine.createSpyObj('queryParamMap', ['get']);
  activatedRoute_spy.snapshot.queryParamMap.get.and.returnValue('1,2,3');
  const assignment_spy = jasmine.createSpyObj('AssignmentService', ['getAssignment']);
  assignment_spy.getAssignment.and.returnValue(asyncData({
    course: 'course stub',
    assignment: 'assignment stub',
    intro: 'intro stub',
    stv_intro: 'stv_intro stub'
  }));
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute_spy },
        { provide: AssignmentService, useValue: assignment_spy }
      ]
    });
    service = TestBed.get(CorpusService);
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  it('getDocumentIds', () => {
    service.getDocumentIds().subscribe(
      ids => expect(ids).toEqual(['1','2','3']));
    console.error = jasmine.createSpy('error');
    activatedRoute_spy.snapshot.queryParamMap.get.and.returnValue('');
    service.getDocumentIds().subscribe(ids => {
      expect(ids).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
    activatedRoute_spy.snapshot.queryParamMap.get.and.returnValue('1,2,3');
  });

  it('getCorpus', async () =>
    service.getCorpus().subscribe(corpus => {
      expect(corpus.course).toBe('course stub');
      expect(corpus.documents).toEqual(['1','2','3']);
      // check cache
      service.getCorpus().subscribe(corpus => {
        expect(corpus.course).toBe('course stub');
        expect(corpus.documents).toEqual(['1','2','3']);
      });
    })
  );
});
