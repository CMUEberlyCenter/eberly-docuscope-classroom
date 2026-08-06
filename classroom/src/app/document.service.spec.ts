import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../environments/environment';
import { DocumentService } from './document.service';
import { HttpErrorHandlerService } from './http-error-handler.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  Mocked,
  vi,
} from 'vitest';

const data = {
  course: 'course',
  assignment: 'assignment',
  instructor: 'instructor',
  documents: [
    {
      text_id: '1',
      owner: 's1',
      ownedby: 'student',
      word_count: 0,
      html_content: '',
    },
    {
      text_id: '2',
      owner: 's2',
      ownedby: 'instructor',
      word_count: 0,
      html_content: '',
    },
  ],
};

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;
  let errorServiceMock: Mocked<HttpErrorHandlerService>;
  const server = `${environment.backend_server}/document`;

  beforeEach(() => {
    errorServiceMock = {
      createHandleError: vi
        .fn()
        .mockName('HttpErrorHandlerService.createHandleError')
        .mockReturnValue(
          () =>
            (_fn: () => unknown, edata: unknown): unknown =>
              edata
        ),
    } as unknown as Mocked<HttpErrorHandlerService>;
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [
        DocumentService,
        { provide: HttpErrorHandlerService, useValue: errorServiceMock },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', async () => {
    expect(service).toBeTruthy();
    expect(errorServiceMock.createHandleError).toHaveBeenCalledWith(
      'DocumentService'
    );
  });

  // it('server', () => expect(service.server).toBe(server));

  it('getData', async () => {
    service.getData(['1', '2']).subscribe((d) => {
      void expect(d.documents[0].text_id).toBe('1');
    });
    const req = httpMock.expectOne(server);
    expect(req.request.method).toBe('POST');
    req.flush(data);
  });
});
