import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';
import { ReportService } from './report.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [
        ReportService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', async () => {
    await expect(service).toBeTruthy();
  });

  it('getReports', async () => {
    service
      .getReports(['a', 'b', 'c'], 'my intro', 'my other intro')
      .subscribe((data) => {
        void expect(data).toBeTruthy();
      });
    const req = httpMock.expectOne(
      `${environment.backend_server}/generate_reports`
    );
    await expect(req.request.method).toBe('POST');
    req.flush(new Blob(['report']));
  });
});
