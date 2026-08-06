/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignmentService } from './assignment.service';
import { CorpusService } from './corpus.service';

describe('CorpusService', () => {
  let service: CorpusService;
  let params: Record<string, string> = { ids: '1,2,3' };
  const assignment_spy = {
    getAssignment: vi
      .fn()
      .mockName('AssignmentService.getAssignment')
      .mockReturnValue(
        of({
          course: 'course stub',
          assignment: 'assignment stub',
          intro: 'intro stub',
          stv_intro: 'stv_intro stub',
        })
      ),
  } as unknown as AssignmentService;
  beforeEach(() => {
    params = { ids: '1,2,3' };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => params[key] ?? null,
                has: (key: string) => key in params,
              },
            },
          },
        },
        { provide: AssignmentService, useValue: assignment_spy },
      ],
    });
    service = TestBed.inject(CorpusService);
  });

  it('should be created', async () => {
    expect(service).toBeDefined();
  });

  it('getDocumentIds', async () => {
    expect(service.getDocumentIds()).toEqual(['1', '2', '3']);
    console.error = vi.fn().mockName('error');
    params = {};
    expect(service.getDocumentIds()).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('getCorpus', () =>
    service.getCorpus().subscribe((corpus) => {
      expect(corpus).toEqual(['1', '2', '3']);
      // check cache
      service.getCorpus().subscribe((corp) => {
        expect(corp).toEqual(['1', '2', '3']);
      });
    }));
});
