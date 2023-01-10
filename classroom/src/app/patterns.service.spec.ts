import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Spied } from 'src/testing';
import { environment } from './../environments/environment';
import { HttpErrorHandlerService } from './http-error-handler.service';
import {
  ComparePatternData,
  instance_count,
  PatternsService,
  pattern_compare,
} from './patterns.service';

describe('PatternsService', () => {
  let service: PatternsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const heh_spy = jasmine.createSpyObj('HttpErrorHandlerService', [
      'createHandleError',
    ]) as Spied<HttpErrorHandlerService>;
    heh_spy.createHandleError.and.returnValue(
      () => (_fn: () => unknown, edata: unknown) => edata
    );
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule],
      providers: [
        PatternsService,
        { provide: HttpErrorHandlerService, useValue: heh_spy },
      ],
    });
    service = TestBed.inject(PatternsService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('should be created', async () => {
    await expect(service).toBeTruthy();
  });

  it('getPatterns', async () => {
    const corpus = ['a', 'b', 'c'];
    const pattern_data = [
      {
        category: 'test',
        patterns: [
          { pattern: 'a', count: 1 },
          { pattern: 'a', count: 3 },
          { pattern: 'b', count: 1 },
        ],
      },
    ];
    service.getPatterns(corpus).subscribe((data) => {
      void expect(data[0].category).toBe('test');
    });
    const req = httpMock.expectOne(`${environment.backend_server}/patterns`);
    await expect(req.request.method).toBe('POST');
    req.flush(pattern_data);

    // check caching
    service.getPatterns(corpus).subscribe((data) => {
      void expect(data[0].category).toBe('test');
    });
  });
});

describe('pattern_compare', () => {
  const pattern_a1 = { pattern: 'a', count: 1 };
  const pattern_a3 = { pattern: 'a', count: 3 };
  const pattern_b1 = { pattern: 'b', count: 1 };
  it('diff count', async () => {
    await expect(pattern_compare(pattern_a1, pattern_a3)).toBe(2);
    await expect(pattern_compare(pattern_a3, pattern_a1)).toBe(-2);
  });
  it('diff pattern', async () => {
    await expect(pattern_compare(pattern_a1, pattern_a1)).toBe(0);
    await expect(pattern_compare(pattern_a1, pattern_b1)).toBe(-1);
    await expect(pattern_compare(pattern_b1, pattern_a1)).toBe(1);
  });
});

describe('ComparePatternData', () => {
  const p: ComparePatternData = new ComparePatternData('a', [1, 2]);
  it('constructor', async () => {
    await expect(p).toBeTruthy();
    await expect(p.pattern).toBe('a');
  });
  it('count', () => expect(p.count).toBe(3));
  it('count0', () => expect(p.count0).toBe(1));
  it('count1', () => expect(p.count1).toBe(2));
});

describe('instance_count', () => {
  it('instance_count', async () => {
    await expect(instance_count([])).toBe(0);
    await expect(instance_count([{ pattern: 'foo', count: 3 }])).toBe(3);
    await expect(
      instance_count([
        { pattern: 'foo', count: 3 },
        { pattern: 'bar', count: 6 },
        { pattern: 'baz', count: 1 },
      ])
    ).toBe(10);
  });
});
