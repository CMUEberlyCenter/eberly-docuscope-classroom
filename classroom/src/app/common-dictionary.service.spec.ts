import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import { FAKE_COMMON_DICTIONARY } from 'src/testing';
import { CommonDictionaryService } from './common-dictionary.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('CommonDictionaryService', () => {
  let service: CommonDictionaryService;
  let httpMock: HttpTestingController;
  const server = `${environment.backend_server}/common_dictionary`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatMenuModule, MatSnackBarModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CommonDictionaryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', async () => {
    await expect(service).toBeTruthy();
  });

  it('getJSON', async () => {
    service.getJSON().subscribe((common) => {
      void expect(common.default_dict).toBe('fake_dict');
    });
    const req = httpMock.expectOne(server);
    await expect(req.request.method).toBe('GET');
    req.flush(FAKE_COMMON_DICTIONARY);
    service.getJSON().subscribe((common) => {
      void expect(common.default_dict).toBe('fake_dict');
    });
  });
});
