import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { PatternsService, pattern_compare } from './patterns.service';
import { environment } from './../environments/environment';

describe('PatternsService', () => {
  let service: PatternsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, MatSnackBarModule ],
      providers: [ PatternsService ]
    });
    service = TestBed.get(PatternsService);
    httpMock = TestBed.get(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getPatterns', () => {
    const corpus = {course: 'Test Course', assignment: 'Test Assignment',
                    intro: 'my intro', stv_intro: 'my other intro',
                    documents: ['a', 'b', 'c']};
    const pattern_data = [
      {
        category: {id: 'test', name: 'Test Pattern', description: 'rrrgggbbb'},
        patterns: [
          {pattern: 'a', count: 1},
          {pattern: 'a', count: 3},
          {pattern: 'b', count: 1}
        ]
      }
    ];
    service.getPatterns(corpus).subscribe(data => {
      expect(data[0].category.id).toBe('test');
    });
    const req = httpMock.expectOne(`${environment.backend_server}/patterns`);
    expect(req.request.method).toBe('POST');
    req.flush(pattern_data);

    // check caching
    service.getPatterns(corpus).subscribe(data => {
      expect(data[0].category.id).toBe('test');
    });
  });
});

describe('pattern_compare', () => {
  const pattern_a1 = {pattern: 'a', count: 1};
  const pattern_a3 = {pattern: 'a', count: 3};
  const pattern_b1 = {pattern: 'b', count: 1};
  it('diff count', () => {
    expect(pattern_compare(pattern_a1, pattern_a3)).toBe(2);
    expect(pattern_compare(pattern_a3, pattern_a1)).toBe(-2);
  });
  it('diff pattern', () => {
    expect(pattern_compare(pattern_a1, pattern_a1)).toBe(0);
    expect(pattern_compare(pattern_a1, pattern_b1)).toBe(-1);
    expect(pattern_compare(pattern_b1, pattern_a1)).toBe(1);
  });
});
