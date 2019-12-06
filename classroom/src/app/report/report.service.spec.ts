import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ReportService } from './report.service';
import { MessageService } from '../message.service';
import { environment } from '../../environments/environment';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;
  let message_service_spy;

  beforeEach(() => {
    message_service_spy = jasmine.createSpyObj('MessageService', ['add']);
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, MatSnackBarModule ],
      providers: [ ReportService,
                   { provide: MessageService, useValue: message_service_spy } ]
    });
    service = TestBed.get(ReportService);
    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getReports', () => {
    service.getReports(['a', 'b', 'c'], 'my intro', 'my other intro')
      .subscribe(data => {
        expect(data).toBeTruthy();
      });
    const req = httpMock.expectOne(`${environment.backend_server}/generate_reports`);
    expect(req.request.method).toBe('POST');
    req.flush(new Blob(['report']));
  });
});
