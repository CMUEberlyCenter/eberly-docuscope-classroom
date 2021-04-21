import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';
import { environment } from 'src/environments/environment';
import { FAKE_COMMON_DICTIONARY } from 'src/testing';
import { CommonDictionaryService } from './common-dictionary.service';

describe('CommonDictionaryService', () => {
  let service: CommonDictionaryService;
  let httpMock: HttpTestingController;
  const server = `${environment.backend_server}/common_dictionary`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatMenuModule],
    });
    service = TestBed.inject(CommonDictionaryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getJSON', () => {
    service.getJSON().subscribe((common) => {
      expect(common.default_dict).toBe('fake_dict');
    });
    const req = httpMock.expectOne(server);
    expect(req.request.method).toBe('GET');
    req.flush(FAKE_COMMON_DICTIONARY);
  });
});
