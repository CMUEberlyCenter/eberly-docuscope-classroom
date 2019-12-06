import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ReportIntroductionService } from './report-introduction.service';

describe('ReportIntroductionService', () => {
  let service: ReportIntroductionService;
  let httpMock: HttpTestingController;

  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ],
    providers: [ ReportIntroductionService ]
  }));

  beforeEach(() => {
    service = TestBed.get(ReportIntroductionService);
    httpMock = TestBed.get(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getIntroductionText', () => {
    const data = {introduction: 'intro', stv_introduction: 'stv'};
    service.getIntroductionText().subscribe(intro => expect(intro).toEqual(data));
    const req = httpMock.expectOne('assets/report_introduction_default.json');
    expect(req.request.method).toBe('GET');
    req.flush(data);
  });
  it('getIntroductionText error', () => {
    service.getIntroductionText().subscribe(intro => expect(intro).toBeTruthy());
    const req = httpMock.expectOne('assets/report_introduction_default.json');
    expect(req.request.method).toBe('GET');
    req.flush('File Not Found', { status: 404, statusText: 'File not found' });
  });
});
