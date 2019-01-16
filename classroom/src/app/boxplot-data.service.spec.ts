import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { BoxplotDataService } from './boxplot-data.service';
import { AppSettingsService } from './app-settings.service';

describe('BoxplotDataService', () => {
  beforeEach(() => {
    const app_settings_spy = jasmine.createSpyObj('AppSettingsService', ['loadSettings']);
    app_settings_spy.config = { backend_server: '' };
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ BoxplotDataService,
                   { provide: AppSettingsService, useValue: app_settings_spy} ]
    });
  });

  it('should be created', () => {
    const service: BoxplotDataService = TestBed.get(BoxplotDataService);
    expect(service).toBeTruthy();
  });
});
