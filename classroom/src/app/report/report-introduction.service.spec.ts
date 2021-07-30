import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReportIntroductionService } from './report-introduction.service';

describe('ReportIntroductionService', () => {
  let service: ReportIntroductionService;
  let httpMock: HttpTestingController;

  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportIntroductionService],
    })
  );

  beforeEach(() => {
    service = TestBed.inject(ReportIntroductionService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('should be created', () => {
    void expect(service).toBeTruthy();
  });

  it('getIntroductionText', () => {
    const data = { introduction: 'intro', stv_introduction: 'stv' };
    service
      .getIntroductionText()
      .subscribe((intro) => void expect(intro).toEqual(data));
    const req = httpMock.expectOne('assets/report_introduction_default.json');
    void expect(req.request.method).toBe('GET');
    req.flush(data);
  });
  it('getIntroductionText error', () => {
    service
      .getIntroductionText()
      .subscribe((intro) => void expect(intro).toBeTruthy());
    const req = httpMock.expectOne('assets/report_introduction_default.json');
    void expect(req.request.method).toBe('GET');
    req.flush('File Not Found', { status: 404, statusText: 'File not found' });
  });
});
