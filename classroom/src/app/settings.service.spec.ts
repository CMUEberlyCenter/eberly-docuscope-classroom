import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SettingsService } from './settings.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('SettingsService', () => {
  let service: SettingsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', async () => {
    await expect(service).toBeTruthy();
  });

  it('getSettings', async () => {
    void firstValueFrom(service.getSettings()).then(async (data) => {
      await expect(data.title).toBe('DocuScope Classroom');
      await expect(data.unit).toBe(100);
    });
    const ereq = httpMock.expectOne('assets/settings.json');
    await expect(ereq.request.method).toBe('GET');
    ereq.error(new ProgressEvent('fail'), { status: 404 });

    service.getSettings().subscribe((data) => {
      void expect(data.title).toBe('TestScope');
      void expect(data.unit).toBe(1);
      void expect(data.sticky_headers).toBeTrue(); // check defaults.
    });
    const req = httpMock.expectOne('assets/settings.json');
    await expect(req.request.method).toBe('GET');
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
