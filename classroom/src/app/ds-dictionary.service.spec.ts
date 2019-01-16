import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DSDictionaryService } from './ds-dictionary.service';
import { AppSettingsService } from './app-settings.service';

describe('DsDictionaryService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const app_settings_spy = jasmine.createSpyObj('AppSettingsService', ['loadSettings']);
    app_settings_spy.config = { backend_server: '' };

    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ DSDictionaryService,
                   { provide: AppSettingsService, useValue: app_settings_spy} ]
    });

    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    const service: DSDictionaryService = TestBed.get(DSDictionaryService);
    expect(service).toBeTruthy();
  });
});
