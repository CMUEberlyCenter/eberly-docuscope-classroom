import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TaggedTextService } from './tagged-text.service';
import { AppSettingsService } from './app-settings.service';

describe('TaggedTextService', () => {
  beforeEach(() => {
    const app_settings_spy = jasmine.createSpyObj('AppSettingsService', ['loadSettings']);
    app_settings_spy.config = { backend_server: '' };

    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ TaggedTextService,
                   { provide: AppSettingsService, useValue: app_settings_spy } ]
    });
  });

  it('should be created', () => {
    const service: TaggedTextService = TestBed.get(TaggedTextService);
    expect(service).toBeTruthy();
  });
});
