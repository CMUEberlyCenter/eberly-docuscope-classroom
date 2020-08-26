import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { DocumentService } from './document.service';
import { environment } from './../environments/environment';
import { HttpErrorHandlerService } from './http-error-handler.service';

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
      html_content: ''
    },
    {
      text_id: '2',
      owner: 's2',
      ownedby: 'instructor',
      word_count: 0,
      html_content: ''
    }
  ]
}

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;
  let errorServiceMock;
  const server = `${environment.backend_server}/document`;

  beforeEach(() => {
    errorServiceMock = jasmine.createSpyObj('HttpErrorHandlerService', ['createHandleError']);
    errorServiceMock.createHandleError.and.returnValue(() => (fn, edata) => edata);
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, MatSnackBarModule ],
      providers: [
         DocumentService,
         { provide: HttpErrorHandlerService, useValue: errorServiceMock }
      ]
    });
    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(errorServiceMock.createHandleError).toHaveBeenCalledWith('DocumentService');
  });

  //it('server', () => expect(service.server).toBe(server));

  it('getData', () => {
    service.getData(['1','2']).subscribe(d => {
      expect(d.documents[0].text_id).toBe('1')
    });
    const req = httpMock.expectOne(server);
    expect(req.request.method).toBe('POST');
    req.flush(data);
  });
});
