import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AppSettingsService } from './app-settings.service';

describe('AppSettingsService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ],
    providers: [ AppSettingsService ]
  }));

  it('should be created', () => {
    const service: AppSettingsService = TestBed.get(AppSettingsService);
    expect(service).toBeTruthy();
  });
});
