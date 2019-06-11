import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ReportService } from './report.service';
import { AppSettingsService } from './app-settings.service';
import { MessageService } from './message.service';

describe('ReportService', () => {
  beforeEach(() => {
    const app_settings_spy = jasmine.createSpyObj('AppSettingsService', ['loadSettings']);
    app_settings_spy.config = { backend_server: '' };

    const message_service_spy = jasmine.createSpyObj('MessageService', ['add']);
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ ReportService,
                   { provide: AppSettingsService, useValue: app_settings_spy },
                   { provide: MessageService, useValue: message_service_spy } ]
    });
  });

  it('should be created', () => {
    const service: ReportService = TestBed.get(ReportService);
    expect(service).toBeTruthy();
  });
});
