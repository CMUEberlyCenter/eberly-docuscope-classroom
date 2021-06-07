import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ReportService } from './report.service';
import { environment } from '../../environments/environment';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule],
      providers: [ReportService],
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    void expect(service).toBeTruthy();
  });

  it('getReports', () => {
    service
      .getReports(['a', 'b', 'c'], 'my intro', 'my other intro')
      .subscribe((data) => {
        void expect(data).toBeTruthy();
      });
    const req = httpMock.expectOne(
      `${environment.backend_server}/generate_reports`
    );
    void expect(req.request.method).toBe('POST');
    req.flush(new Blob(['report']));
  });
});
