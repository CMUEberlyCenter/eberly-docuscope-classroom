import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReportIntroductionService } from './report-introduction.service';

describe('ReportIntroductionService', () => {
  let service: ReportIntroductionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportIntroductionService],
    });
    service = TestBed.inject(ReportIntroductionService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('should be created', async () => {
    await expect(service).toBeTruthy();
  });

  it('getIntroductionText', async () => {
    const data = { introduction: 'intro', stv_introduction: 'stv' };
    service
      .getIntroductionText()
      .subscribe((intro) => void expect(intro).toEqual(data));
    const req = httpMock.expectOne('assets/report_introduction_default.json');
    await expect(req.request.method).toBe('GET');
    req.flush(data);
  });
  it('getIntroductionText error', async () => {
    service
      .getIntroductionText()
      .subscribe((intro) => void expect(intro).toBeTruthy());
    const req = httpMock.expectOne('assets/report_introduction_default.json');
    await expect(req.request.method).toBe('GET');
    req.flush('File Not Found', { status: 404, statusText: 'File not found' });
  });
});
