import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(SettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSettings', () => {
    service.getSettings().subscribe((data) => {
      expect(data.title).toBe('DocuScope Classroom');
      expect(data.unit).toBe(100);
    });
    const ereq = httpMock.expectOne('assets/settings.json');
    expect(ereq.request.method).toBe('GET');
    ereq.error(new ErrorEvent('fail'), { status: 404 });

    service.getSettings().subscribe((data) => {
      expect(data.title).toBe('TestScope');
      expect(data.unit).toBe(1);
    });
    const req = httpMock.expectOne('assets/settings.json');
    expect(req.request.method).toBe('GET');
    req.flush({
      title: 'TestScope',
      institution: 'TEST',
      unit: 1,
      homepage: 'http://localhost/',
      scatter: { width: 4, height: 4 },
      mtv: { horizontal: true, documentColors: ['#1c66aa', '#639c54'] },
    });
  });
});
